"use strict";
const paymentRepo = require("../repositories/paymentRepository");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const handlebars = require("handlebars");
const constants = require("../helpers/constants.json");
const { transporter } = require("../helpers/nodemail");
const axios = require("axios");
const stripe = require("stripe")(process.env.STRIP_KEY);
const studentRepo = require("../repositories/studentRepository");
const sendMail = require("../helpers/nodemail");
const mongoose = require("mongoose");
const courseRepo = require("../repositories/courseRepository");
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});
function checkoutRazorpayForPranicPurification(reqBody) {
  return new Promise(async (resolve, reject) => {
    try {
      let userData = {
        name: reqBody.name,
        email: reqBody.email,
        phoneNumber: reqBody.phoneNumber,
        address: reqBody.address ?? "",
        paymentStatus: "pending",
        price: reqBody.price,
        currency: reqBody.currency,
        courseStartDate: reqBody.courseStartDate,
        courseTimeDuration: reqBody.courseTimeDuration,
      };
      const pay = await paymentRepo.createPranicUserData(userData);
      const amountInSubunits = reqBody.price * 100;
      const options = {
        amount: amountInSubunits,
        currency: reqBody.currency,
        receipt: `pranic_${pay._id}`,
        payment_capture: 1,
      };
      const order = await razorpay.orders.create(options);
      return resolve({
        orderId: order.id,
        razorpayKey: process.env.RAZORPAY_KEY_ID,
        payDbId: pay._id,
        amount: amountInSubunits,
        currency: reqBody.currency,
        name: reqBody.name,
        email: reqBody.email,
        phoneNumber: reqBody.phoneNumber,
      });
    } catch (error) {
      return reject(error);
    }
  });
}
function getRazorPaymentResultPranicPurification({
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
  payDbId,
}) {
  return new Promise(async (resolve, reject) => {
    try {
      const hmac = crypto.createHmac("sha256", razorpay.key_secret);
      hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
      const generated_signature = hmac.digest("hex");
      if (generated_signature === razorpay_signature) {
        const user = await paymentRepo.updatePranicUserData(
          payDbId,
          razorpay_payment_id,
          true
        );
        const couponCode = generateCouponCode(user.name);
        const couponcodeData = {
          code: couponCode,
          slug: constants.SLUG.PRANA_ARAMBH,
          email: user.email,
          studentId: user._id,
        };
        await paymentRepo.createCouponCodeData(couponcodeData);
        const mailData = {
          replacements: {
            name: user.name,
            courseTitle:
              "Pranic Purification - Best online pranayama sadhana prashanJ",
            whatsappGroupLink: constants.LINK.WHATSAPP,
            startDate: user.courseStartDate.toDateString(),
            startTime: user.courseTimeDuration,
            code: couponCode,
          },
          mailTo: user.email,
          contentPath: constants.EMAIL_TEMPLATE.PRANIC_PURIFICATION,
          subject: "Pranic Purification Registration Confirmation",
        };
        sendMail.createContent(mailData);
        const whatsappData = {
          templateName: "pranic_purification",
          to: user.phoneNumber,
          headerParam: [
            {
              type: "text",
              text: user.name,
            },
          ],
          params: [
            {
              type: "text",
              text: "Pranic Purification - Best online pranayama sadhana prashanJ",
            },
            { type: "text", text: constants.LINK.WHATSAPP },
            { type: "text", text: user.courseStartDate.toDateString() },
            { type: "text", text: user.courseTimeDuration },
            { type: "text", text: couponCode },
          ],
        };
        sendMail.createWhatsAppContent(whatsappData);
        return resolve({
          status: "success",
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id,
        });
      } else {
        await paymentRepo.updatePranicUserData(payDbId, null, false);
        return reject("Payment verification failed");
      }
    } catch (error) {
      return reject(error);
    }
  });
}
function generateCouponCode(name) {
  const namePart = name
    .substring(0, Math.min(4, name.length))
    .trim()
    .toUpperCase();
  const now = new Date();
  const datePart =
    now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0");
  const randomPart = Math.floor(100000 + Math.random() * 900000).toString();
  return namePart + datePart + randomPart;
}
function checkoutStripeForPranicPurification(reqBody) {
  return new Promise(async (resolve, reject) => {
    try {
      let userData = {
        name: reqBody.name,
        email: reqBody.email,
        phoneNumber: reqBody.phoneNumber,
        address: reqBody.address ?? "",
        paymentStatus: "pending",
        price: reqBody.price,
        currency: reqBody.currency,
        courseStartDate: reqBody.courseStartDate,
        courseTimeDuration: reqBody.courseTimeDuration,
      };
      const pay = await paymentRepo.createPranicUserData(userData);
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: reqBody.currency,
              unit_amount: reqBody.price * 100,
              product_data: {
                name: "Custom Payment",
              },
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: process.env.STRIP_URL,
        cancel_url: process.env.STRIP_URL,
        customer_email: reqBody.email,
      });
      return resolve({
        sessionId: session.id,
        payDbId: pay._id,
        url: session.url,
      });
    } catch (error) {
      return reject(error);
    }
  });
}
function getCouponCode(reqBody) {
  return new Promise(async (resolve, reject) => {
    try {
      const data = {
        slug: reqBody.slug,
        email: reqBody.email,
        isUsed: false,
      };
      const result = await paymentRepo.getCouponByEmail(data);
      return resolve({
        code: result ? result.code : "",
        id: result ? result._id : "",
      });
    } catch (error) {
      return reject(error);
    }
  });
}
function getRazorpayPaymentResultForPranarambha(
  razorpay_payment_id,
  razorpay_order_id,
  razorpay_signature,
  student,
  course,
  payDbId,
  reqAmount,
  reqCurrency,
  couponCodeId
) {
  return new Promise(async (resolve, reject) => {
    try {
      const hmac = crypto.createHmac("sha256", razorpay.key_secret);
      hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
      const generatedSignature = hmac.digest("hex");
      if (generatedSignature !== razorpay_signature) {
        return resolve({
          status: 400,
          result: { status: "failed", message: "Invalid signature" },
        });
      }
      const amount = reqAmount;
      const currency = reqCurrency;
      await paymentRepo.updatePranaArambhPaymentUserData(
        payDbId,
        razorpay_payment_id,
        amount,
        currency
      );
      if (
        couponCodeId !== undefined &&
        couponCodeId !== null &&
        couponCodeId !== ""
      ) {
        await paymentRepo.disableCouponCode(couponCodeId);
      }
      const studentDoc = await studentRepo.getStudentById(student);
      let updatedCourses = studentDoc.course.includes(course)
        ? studentDoc.course
        : [...studentDoc.course, course];
      await studentRepo.updateStudentCourse(student, updatedCourses);
      let coursetitle = await courseRepo.getCourseById(course);
      const { firstName, email, password, phoneNumber } =
        await studentRepo.getStudentById(student);
      let filePath = path.join(
        __dirname,
        "..",
        "controller",
        constants.EMAIL_TEMPLATE.ORDER_CONFIRMATION
      );
      let date = new Date();
      let source = fs.readFileSync(filePath, "utf-8").toString();
      let template = handlebars.compile(source);
      let htmlToSend = template({
        name: firstName,
        course: coursetitle,
        email: email,
        price: `${amount} ${currency}`,
        date: date.toString(),
        password: password,
      });
      let mailOptions = {
        from: "Yoga Vidya School <info@yogavidyaschool.com>",
        to: email,
        subject: `Purchase Confirmation - ${coursetitle}`,
        replyTo: "info@yogavidyaschool.com",
        html: htmlToSend,
      };
      transporter.sendMail(mailOptions, () => {});
      const wspMessage = {
        messaging_product: "whatsapp",
        to: phoneNumber,
        type: "template",
        template: {
          name: "prana_arambha",
          language: { code: "en" },
          components: [
            {
              type: "header",
              parameters: [
                {
                  type: "text",
                  text: firstName,
                },
              ],
            },
            {
              type: "body",
              parameters: [
                { type: "text", text: coursetitle },
                { type: "text", text: coursetitle },
                { type: "text", text: `${amount} ${currency}` },
                { type: "text", text: date.toString() },
                { type: "text", text: email },
                { type: "text", text: password },
              ],
            },
          ],
        },
      };
      axios
        .post(process.env.WHATSAPP_API_URL, wspMessage, {
          headers: {
            Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
            "Content-Type": "application/json",
          },
        })
        .then((response) => {
          console.log("WhatsApp message sent successfully:", response.data);
        })
        .catch((error) => {
          console.log("WhatsApp message error:", error.message);
        });
      const { paymentId } = paymentRepo.getPaymentDetailsById(payDbId);
      filePath = path.join(
        __dirname,
        "..",
        "controller",
        constants.EMAIL_TEMPLATE.ADMIN_ORDER
      );
      htmlToSend = template({
        name: firstName,
        course: coursetitle,
        email: email,
        price: amount,
        payId: paymentId,
        currency: currency,
      });
      mailOptions = {
        from: "Yoga Vidya School <info@yogavidyaschool.com>",
        to: "info@yogavidyaschool.com",
        subject: `Admin Purchase Confirmation - ${coursetitle}`,
        replyTo: "info@yogavidyaschool.com",
        html: htmlToSend,
      };
      transporter.sendMail(mailOptions, () => {});
      return resolve({
        status: 200,
        result: {
          status: "success",
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id,
          amount: amount,
          currency: currency,
        },
      });
    } catch (error) {
      return reject(error);
    }
  });
}
function getPaymentResultPranicPurification(reqBody) {
  return new Promise(async (resolve, reject) => {
    try {
      const session = await stripe.checkout.sessions.retrieve(
        reqBody.pranicPurificationSessionId
      );
      if (session.payment_status == "paid") {
        const user = await paymentRepo.updatePranicUserData(
          reqBody.payDbId,
          session.payment_intent,
          true
        );
        const couponCode = generateCouponCode(user.name);
        const couponcodeData = {
          code: couponCode,
          slug: constants.SLUG.PRANA_ARAMBH,
          email: user.email,
          studentId: user._id,
        };
        await paymentRepo.createCouponCodeData(couponcodeData);
        const mailData = {
          replacements: {
            name: user.name,
            courseTitle:
              "Pranic Purification - Best online pranayama sadhana prashanJ",
            whatsappGroupLink: constants.LINK.WHATSAPP,
            startDate: user.courseStartDate.toDateString(),
            startTime: user.courseTimeDuration,
            code: couponCode,
          },
          mailTo: user.email,
          contentPath: constants.EMAIL_TEMPLATE.PRANIC_PURIFICATION,
          subject: "Pranic Purification Registration Confirmation",
        };
        sendMail.createContent(mailData);
        const whatsappData = {
          templateName: "pranic_purification",
          to: user.phoneNumber,
          headerParam: [
            {
              type: "text",
              text: user.name,
            },
          ],
          params: [
            {
              type: "text",
              text: "Pranic Purification - Best online pranayama sadhana prashanJ",
            },
            { type: "text", text: constants.LINK.WHATSAPP },
            { type: "text", text: user.courseStartDate.toDateString() },
            { type: "text", text: user.courseTimeDuration },
            { type: "text", text: couponCode },
          ],
        };
        sendMail.createWhatsAppContent(whatsappData);
        return resolve({
          status: 200,
          data: {
            status: "success",
            sessionId: reqBody.pranicPurificationSessionId,
            paymtId: session.payment_intent,
            amount: session.amount_total / 100,
            currency: session.currency,
          },
        });
      } else {
        await paymentRepo.updatePranicUserData(reqBody.payDbId, null, false);
        return resolve({
          status: 200,
          data: {
            status: "failed",
            sessionId: reqBody.pranicPurificationSessionId,
          },
        });
      }
    } catch (error) {
      return reject(error);
    }
  });
}
function disableCouponCode(reqBody) {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await paymentRepo.disableCouponCode(reqBody.id);
      return resolve(1);
    } catch (error) {
      return reject(error);
    }
  });
}
function checkoutRazorpayFor200TTC(reqBody) {
  return new Promise(async (resolve, reject) => {
    try {
      let pay;
      if (reqBody.id) {
        pay = await paymentRepo.updateInstallmentPayment200TTCata(
          reqBody.id,
          reqBody.price
        );
      } else {
        let userData = {
          name: reqBody.name,
          email: reqBody.email,
          phoneNumber: reqBody.phoneNumber,
          package: reqBody.package,
          currency: reqBody.currency,
          price: reqBody.price,
          courseStartDate: reqBody.courseStartDate,
          courseTimeDuration: reqBody.courseTimeDuration,
        };
        pay = await paymentRepo.create200TTCData(userData);
      }
      const amountInSubunits = reqBody.price * 100;
      const options = {
        amount: amountInSubunits,
        currency: reqBody.currency,
        receipt: `200TTC_${pay._id}`,
        payment_capture: 1,
      };
      const order = await razorpay.orders.create(options);
      return resolve({
        orderId: order.id,
        razorpayKey: process.env.RAZORPAY_KEY_ID,
        payDbId: pay._id,
        amount: amountInSubunits,
      });
    } catch (error) {
      return reject(error);
    }
  });
}
function getRazorPaymentResult200TTC(reqBody) {
  return new Promise(async (resolve, reject) => {
    try {
      const hmac = crypto.createHmac("sha256", razorpay.key_secret);
      hmac.update(reqBody.razorpayOrderId + "|" + reqBody.razorpayPaymentId);
      const generatedSignature = hmac.digest("hex");
      if (generatedSignature === reqBody.razorpaySignature) {
        const user = await paymentRepo.update200TTCata(
          reqBody.payDbId,
          reqBody.razorpayPaymentId,
          true,
          reqBody.installment,
          reqBody.dueAmnt
        );
        if (reqBody.installment == "2nd") {
          await savePranaArambhOn200TTC(user, reqBody);
        }
        // await saveLiveClassOn200TTC(user, reqBody);
        const fileName =
          reqBody.installment == "1st"
            ? constants.EMAIL_TEMPLATE["200_HOURS_TTC_1ST"]
            : constants.EMAIL_TEMPLATE["200_HOURS_TTC"];
        const mailData = {
          replacements: {
            name: user.name,
            whatsappGroupLink: constants.LINK.WHATSAPP,
            startDate: user.courseStartDate.toDateString(),
            startTime: user.courseTimeDuration,
            userId: user.email,
            pass: reqBody.password,
            courseTitle: reqBody.courseTitle,
          },
          mailTo: user.email,
          contentPath: fileName,
          subject: "🕉 Welcome to the Yoga Vidya Family!",
        };
        sendMail.createContent(mailData);
        // const whatsappData = {
        //   templateName: "pranic_purification",
        //   to: user.phoneNumber,
        //   headerParam: [
        //     {
        //       type: "text",
        //       text: user.name,
        //     },
        //   ],
        //   params: [
        //     {
        //       type: "text",
        //       text: "Pranic Purification - Best online pranayama sadhana prashanJ",
        //     },
        //     { type: "text", text: constants.LINK.WHATSAPP },
        //     { type: "text", text: user.courseStartDate.toDateString() },
        //     { type: "text", text: user.courseTimeDuration },
        //     { type: "text", text: couponCode },
        //   ],
        // };
        // sendMail.createWhatsAppContent(whatsappData);
        return resolve({
          amount: +user.price,
          currency: user.currency,
        });
      } else {
        await paymentRepo.updatePranicUserData(reqBody.payDbId, null, false);
        return reject("Payment verification failed");
      }
    } catch (error) {
      return reject(error);
    }
  });
}
function checkoutStripeFor200TTC(reqBody) {
  return new Promise(async (resolve, reject) => {
    try {
      let pay;
      if (reqBody.id) {
        pay = await paymentRepo.updateInstallmentPayment200TTCata(
          reqBody.id,
          reqBody.price
        );
      } else {
        let userData = {
          name: reqBody.name,
          email: reqBody.email,
          phoneNumber: reqBody.phoneNumber,
          package: reqBody.package,
          currency: reqBody.currency,
          price: reqBody.price,
          courseStartDate: reqBody.courseStartDate,
          courseTimeDuration: reqBody.courseTimeDuration,
        };
        pay = await paymentRepo.create200TTCData(userData);
      }
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: reqBody.currency,
              unit_amount: reqBody.price * 100,
              product_data: {
                name: "Custom Payment",
              },
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: process.env.STRIP_URL,
        cancel_url: process.env.STRIP_URL,
        customer_email: reqBody.email,
      });
      return resolve({
        sessionId: session.id,
        payDbId: pay._id,
        url: session.url,
      });
    } catch (error) {
      return reject(error);
    }
  });
}
function getStripePaymentResult200TTC(reqBody) {
  return new Promise(async (resolve, reject) => {
    try {
      const session = await stripe.checkout.sessions.retrieve(
        reqBody.sessionId
      );
      if (session.payment_status == "paid") {
        const user = await paymentRepo.update200TTCata(
          reqBody.payDbId,
          session.payment_intent,
          true,
          reqBody.installment,
          reqBody.dueAmnt
        );
        if (reqBody.installment == "2nd") {
          await savePranaArambhOn200TTC(user, reqBody);
        }
        // await saveLiveClassOn200TTC(user, reqBody);
        const fileName =
          reqBody.installment == "1st"
            ? constants.EMAIL_TEMPLATE["200_HOURS_TTC_1ST"]
            : constants.EMAIL_TEMPLATE["200_HOURS_TTC"];
        const mailData = {
          replacements: {
            name: user.name,
            whatsappGroupLink: constants.LINK.WHATSAPP,
            startDate: user.courseStartDate.toDateString(),
            startTime: user.courseTimeDuration,
            userId: user.email,
            pass: reqBody.password,
            courseTitle: reqBody.courseTitle,
          },
          mailTo: user.email,
          contentPath: fileName,
          subject: "🕉 Welcome to the Yoga Vidya Family!",
        };
        sendMail.createContent(mailData);
        // const whatsappData = {
        //   templateName: "pranic_purification",
        //   to: user.phoneNumber,
        //   headerParam: [
        //     {
        //       type: "text",
        //       text: user.name,
        //     },
        //   ],
        //   params: [
        //     {
        //       type: "text",
        //       text: "Pranic Purification - Best online pranayama sadhana prashanJ",
        //     },
        //     { type: "text", text: constants.LINK.WHATSAPP },
        //     { type: "text", text: user.courseStartDate.toDateString() },
        //     { type: "text", text: user.courseTimeDuration },
        //     { type: "text", text: couponCode },
        //   ],
        // };
        // sendMail.createWhatsAppContent(whatsappData);
        return resolve({
          status: 200,
          data: {
            status: "success",
            paymtId: session.payment_intent,
            amount: session.amount_total / 100,
            currency: session.currency,
          },
        });
      } else {
        await paymentRepo.updatePranicUserData(reqBody.payDbId, null, false);
        return resolve({
          status: 200,
          data: {
            status: "failed",
            sessionId: reqBody.pranicPurificationSessionId,
          },
        });
      }
    } catch (error) {
      return reject(error);
    }
  });
}
function savePranaArambhOn200TTC(user, reqBody) {
  return new Promise(async (resolve, reject) => {
    try {
      let studentData = {
        email: user.email,
        firstName: user.name,
        isActive: true,
        password: reqBody.password,
        phoneNumber: user.phoneNumber,
        course: [
          constants.COURSE.PRANA_ARAMBHA,
          constants.COURSE.FOUNDATION_SPIRITUALITY,
        ],
        source: "web",
        is200TTC: true,
      };
      let studentRes = await studentRepo.createStudent(studentData);
      let paymentData = {
        courseId: mongoose.Types.ObjectId(constants.COURSE.PRANA_ARAMBHA),
        studentId: mongoose.Types.ObjectId(studentRes._id),
        paymentStatus: constants.PAYMENT_STATUS.PAID,
        amount: user.price,
        currency: user.currency,
        paymentId: reqBody.razorpayPaymentId,
      };
      await paymentRepo.createPaymentDetails(paymentData);
      return resolve(1);
    } catch (error) {
      return reject(error);
    }
  });
}
function saveLiveClassOn200TTC(user, reqBody) {
  return new Promise(async (resolve, reject) => {
    try {
      let studentData = {
        email: user.email,
        name: user.name,
        phone: user.phoneNumber,
        courses: [
          {
            title: reqBody.courseTitle,
            quantity: 1,
          },
        ],
        paymentStatus: "paid",
        is200TTC: true,
        price: user.price,
        currency: user.currency,
        paymentId: reqBody.razorpayPaymentId,
      };
      await studentRepo.createLiveClassData(studentData);
      return resolve(1);
    } catch (error) {
      return reject(error);
    }
  });
}
function secondInstallmentPaymentMail() {
  return new Promise(async (resolve, reject) => {
    try {
      const today = new Date();
      const Fortnight = new Date();
      Fortnight.setDate(today.getDate() - 14);
      const threeWeeks = new Date();
      threeWeeks.setDate(today.getDate() - 21);
      const paymentData = await paymentRepo.secondInstallmentPaymentMail(
        threeWeeks,
        Fortnight
      );
      for (const obj of paymentData) {
        const mailData = {
          replacements: {
            NAME: obj.name,
            AMOUNT: obj.dueAmount,
            COURSE: "200 Hours Yoga TTC",
            LINK:
              process.env.MAIN_URL +
              `/checkout/200-hours-yoga-teacher-training-online?id=${obj._id}`,
          },
          mailTo: obj.email,
          contentPath: constants.EMAIL_TEMPLATE.SECOND_INSTALLMENT,
          subject: "200 Hours Yoga TTC Second Installment Payment",
        };
        sendMail.createContent(mailData);
      }
      resolve(1);
    } catch (error) {
      return reject(error);
    }
  });
}
function getPaymentDetailsById(id) {
  return new Promise(async (resolve, reject) => {
    try {
      const paymentDetails = await paymentRepo.getPaymentDetailsById(id);
      resolve(paymentDetails);
    } catch (error) {
      return reject(error);
    }
  });
}
function checkoutRazorpayRishikesh(reqBody) {
  return new Promise(async (resolve, reject) => {
    try {
      let pay = await paymentRepo.createRishikeshData(reqBody);
      const amountInSubunits = reqBody.price * 100;
      const options = {
        amount: amountInSubunits,
        currency: reqBody.currency,
        receipt: `rishikesh_${reqBody.hour}_${pay._id}`,
        payment_capture: 1,
      };
      const order = await razorpay.orders.create(options);
      return resolve({
        orderId: order.id,
        razorpayKey: process.env.RAZORPAY_KEY_ID,
        payDbId: pay._id,
        amount: amountInSubunits,
      });
    } catch (error) {
      return reject(error);
    }
  });
}
function getRazorPaymentResultRishikesh(reqBody) {
  return new Promise(async (resolve, reject) => {
    try {
      const hmac = crypto.createHmac("sha256", razorpay.key_secret);
      hmac.update(reqBody.razorpayOrderId + "|" + reqBody.razorpayPaymentId);
      const generatedSignature = hmac.digest("hex");
      if (generatedSignature === reqBody.razorpaySignature) {
        const user = await paymentRepo.updateRishikeshStudentData(
          reqBody.payDbId,
          reqBody.razorpayPaymentId,
          true
        );
        let mailData;
        if (user.hour == 100) {
          const fileName = constants.EMAIL_TEMPLATE.RISHI100;
          mailData = {
            replacements: {
              NAME: user.name,
              WLINK: constants.LINK.WHATSAPP_RISHIKESH_200,
            },
            mailTo: user.email,
            contentPath: fileName,
            subject: "🕉 Welcome to Your Yogic Journey – 100 Hrs TTC",
          };
        } else if (user.hour == 200) {
          const fileName = constants.EMAIL_TEMPLATE.RISHIKESH;
          mailData = {
            replacements: {
              NAME: user.name,
              COURSE: "200-Hour Yoga Teacher Training in Rishikesh",
              WLINK: constants.LINK.WHATSAPP_RISHIKESH_200,
            },
            mailTo: user.email,
            contentPath: fileName,
            subject: "🕉 Welcome to the Yoga Vidya Family!",
          };
        } else if (user.hour == 300) {
          const fileName = constants.EMAIL_TEMPLATE.RISHI300;
          mailData = {
            replacements: {
              NAME: user.name,
              WLINK: constants.LINK.WHATSAPP_RISHIKESH_200,
            },
            mailTo: user.email,
            contentPath: fileName,
            subject: "🕉 Welcome to the Next Step – 300 Hrs TTC",
          };
        }
        sendMail.createContent(mailData);
        return resolve({
          amount: +user.price,
          currency: user.currency,
        });
      } else {
        await paymentRepo.updateRishikeshStudentData(
          reqBody.payDbId,
          null,
          false
        );
        return reject("Payment verification failed");
      }
    } catch (error) {
      return reject(error);
    }
  });
}
function checkoutStripeForRishikesh(reqBody) {
  return new Promise(async (resolve, reject) => {
    try {
      let pay = await paymentRepo.createRishikeshData(reqBody);
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: reqBody.currency,
              unit_amount: reqBody.price * 100,
              product_data: {
                name: "Custom Payment",
              },
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: process.env.STRIP_URL,
        cancel_url: process.env.STRIP_URL,
        customer_email: reqBody.email,
      });
      return resolve({
        sessionId: session.id,
        payDbId: pay._id,
        url: session.url,
      });
    } catch (error) {
      return reject(error);
    }
  });
}
function getStripePaymentResultRishikesh(reqBody) {
  return new Promise(async (resolve, reject) => {
    try {
      const session = await stripe.checkout.sessions.retrieve(
        reqBody.sessionId
      );
      if (session.payment_status == "paid") {
        const user = await paymentRepo.updateRishikeshStudentData(
          reqBody.payDbId,
          session.payment_intent,
          true
        );
        let mailData;
        if (user.hour == 100) {
          const fileName = constants.EMAIL_TEMPLATE.RISHI100;
          mailData = {
            replacements: {
              NAME: user.name,
              WLINK: constants.LINK.WHATSAPP_RISHIKESH_200,
            },
            mailTo: user.email,
            contentPath: fileName,
            subject: "🕉 Welcome to Your Yogic Journey – 100 Hrs TTC",
          };
        } else if (user.hour == 200) {
          const fileName = constants.EMAIL_TEMPLATE.RISHIKESH;
          mailData = {
            replacements: {
              NAME: user.name,
              COURSE: "200-Hour Yoga Teacher Training in Rishikesh",
              WLINK: constants.LINK.WHATSAPP_RISHIKESH_200,
            },
            mailTo: user.email,
            contentPath: fileName,
            subject: "🕉 Welcome to the Yoga Vidya Family!",
          };
        } else if (user.hour == 300) {
          const fileName = constants.EMAIL_TEMPLATE.RISHI300;
          mailData = {
            replacements: {
              NAME: user.name,
              WLINK: constants.LINK.WHATSAPP_RISHIKESH_200,
            },
            mailTo: user.email,
            contentPath: fileName,
            subject: "🕉 Welcome to the Next Step – 300 Hrs TTC",
          };
        }
        sendMail.createContent(mailData);
        return resolve({
          status: 200,
          data: {
            status: "success",
            paymtId: session.payment_intent,
            amount: session.amount_total / 100,
            currency: session.currency,
          },
        });
      } else {
        await paymentRepo.updateRishikeshStudentData(
          reqBody.payDbId,
          null,
          false
        );
        return resolve({
          status: 200,
          data: {
            status: "failed",
            sessionId: reqBody.pranicPurificationSessionId,
          },
        });
      }
    } catch (error) {
      return reject(error);
    }
  });
}
module.exports = {
  checkoutRazorpayForPranicPurification,
  getRazorPaymentResultPranicPurification,
  checkoutStripeForPranicPurification,
  getCouponCode,
  getRazorpayPaymentResultForPranarambha,
  getPaymentResultPranicPurification,
  disableCouponCode,
  checkoutRazorpayFor200TTC,
  getRazorPaymentResult200TTC,
  checkoutStripeFor200TTC,
  getStripePaymentResult200TTC,
  secondInstallmentPaymentMail,
  getPaymentDetailsById,
  checkoutRazorpayRishikesh,
  getRazorPaymentResultRishikesh,
  checkoutStripeForRishikesh,
  getStripePaymentResultRishikesh,
};
