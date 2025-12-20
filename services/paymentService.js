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
const helper = require("../helpers/helper");
const paymentTrackingService = require("./paymentTrackingService");

function extractClientData(req) {
  if (!req) {
    return {
      clientIp: "",
      userAgent: "",
      fbc: "",
      fbp: "",
    };
  }

  return {
    clientIp:
      req.ip ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      (req.connection?.socket ? req.connection.socket.remoteAddress : null) ||
      req.headers?.["x-forwarded-for"]?.split(",")[0] ||
      req.headers?.["x-real-ip"] ||
      "",
    userAgent: req.get?.("User-Agent") || "",
    fbc: req.body?.fbc || req.query?.fbc || req.cookies?._fbc || "",
    fbp: req.body?.fbp || req.query?.fbp || req.cookies?._fbp || "",
  };
}

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
        paymentType: "razorpay",
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
      await paymentRepo.pranicPurificationUpdateById(pay._id, {
        paymentId: order.id,
      });
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
  password,
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
        createPranicPurificationStudent(user, password);
        helper.completePranicPurificationAutomationEmail(user, password);
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
        paymentType: "stripe",
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
      await paymentRepo.pranicPurificationUpdateById(pay._id, {
        paymentId: session.id,
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
      await paymentRepo.updatePranaArambhPaymentUserData(payDbId, {
        paymentId: razorpay_payment_id,
        amount: amount,
        currency: currency,
        paymentStatus: "paid",
      });
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
      if (course == constants.COURSE.FOUNDATION_SPIRITUALITY) {
        await helper.completeFoundationOfSpiritualityMail({
          firstName,
          email,
          password,
        });
      } else {
        await helper.sendPranaArambhEmail({
          name: firstName,
          course: coursetitle,
          email: email,
          price: `${amount} ${currency}`,
          date: date.toString(),
          password: password,
        });
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
      }
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
        createPranicPurificationStudent(user, reqBody.password);
        helper.completePranicPurificationAutomationEmail(
          user,
          reqBody.password
        );
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
          paymentType: "razorpay",
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
      await paymentRepo.update200ttcPayment({ paymentId: order.id }, pay._id);
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
function getRazorPaymentResult200TTC(reqBody, req = null) {
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
        const fileName =
          reqBody.installment == "1st"
            ? constants.EMAIL_TEMPLATE["200_HOURS_TTC_1ST"]
            : constants.EMAIL_TEMPLATE["200_HOURS_TTC"];
        const mailData = {
          replacements: {
            name: user.name,
          },
          mailTo: user.email,
          contentPath: fileName,
          subject: "🕉 Welcome to the Yoga Vidya Family!",
        };
        sendMail.createContent(mailData);
        const clientData = req ? extractClientData(req) : {};
        paymentTrackingService.track200TTCPurchase(
          {
            paymentId: reqBody.razorpayPaymentId,
            ...clientData,
          },
          user
        );
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
          paymentType: "stripe",
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
      await paymentRepo.update200ttcPayment({ paymentId: session.id }, pay._id);
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
function getStripePaymentResult200TTC(reqBody, req = null) {
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

        const clientData = req ? extractClientData(req) : {};
        paymentTrackingService.track200TTCPurchase(
          {
            paymentId: session.payment_intent,
            ...clientData,
          },
          user
        );
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
          constants.COURSE.TWO_THOUSANDS_TTC,
          constants.COURSE.PRANA_ARAMBHA,
          constants.COURSE.BREATCH_DTOX,
        ],
        source: "200TTC",
        paymentCourseId: constants.COURSE.TWO_THOUSANDS_TTC,
      };
      let studentRes = await studentRepo.createStudent(studentData);
      // let paymentData = {
      //   courseId: mongoose.Types.ObjectId(constants.COURSE.PRANA_ARAMBHA),
      //   studentId: mongoose.Types.ObjectId(studentRes._id),
      //   paymentStatus: constants.PAYMENT_STATUS.PAID,
      //   amount: user.price,
      //   currency: user.currency,
      //   paymentId: reqBody.razorpayPaymentId,
      // };
      // await paymentRepo.createPaymentDetails(paymentData);
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
      reqBody.paymentType = "razorpay";
      let pay = await paymentRepo.createRishikeshData(reqBody);
      const amountInSubunits = reqBody.price * 100;
      const options = {
        amount: amountInSubunits,
        currency: reqBody.currency,
        receipt: `rishikesh_${reqBody.hour}_${pay._id}`,
        payment_capture: 1,
      };
      const order = await razorpay.orders.create(options);
      await paymentRepo.rishikeshUpdateById(pay._id, {
        paymentId: order.id,
      });
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
              WLINK: constants.LINK["100_HOURS_RISHIKESH"],
              BOOK_LINK: constants.LINK.RISHIKESH_BOOKS,
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
              WLINK: constants.LINK["100_HOURS_RISHIKESH"],
              BOOK_LINK: constants.LINK.RISHIKESH_BOOKS,
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
              WLINK: constants.LINK["300_HOURS_RISHIKESH"],
              BOOK_LINK: constants.LINK.RISHIKESH_BOOKS,
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
      reqBody.paymentType = "stripe";
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
      await paymentRepo.rishikeshUpdateById(pay._id, {
        paymentId: session.id,
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
              WLINK: constants.LINK["100_HOURS_RISHIKESH"],
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
              WLINK: constants.LINK["100_HOURS_RISHIKESH"],
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
              COURSE: "300-Hour Yoga Teacher Training in Rishikesh",
              WLINK: constants.LINK["300_HOURS_RISHIKESH"],
              BOOK_LINK: constants.LINK.RISHIKESH_BOOKS,
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
function updatePaymentId200ttc(reqBody) {
  return new Promise(async (resolve, reject) => {
    try {
      let data;
      if (reqBody.isRazorPay) {
        data = {
          paymentId: reqBody.paymentId,
          orderId: reqBody.orderId,
        };
      } else {
        data = {
          paymentId: reqBody.paymentId,
        };
      }
      await paymentRepo.update200ttcPayment(data, reqBody.id);
      return resolve({
        status: 200,
        status: "success",
      });
    } catch (error) {
      return reject(error);
    }
  });
}
function updatePaymentStatusForcefully() {
  return new Promise(async (resolve, reject) => {
    try {
      const now = new Date();
      const fiveMinutesAhead = new Date(now.getTime() - 3 * 60 * 1000);
      const tenMinutesAhead = new Date(now.getTime() - 10 * 60 * 1000);
      const paymentData = await paymentRepo.updatePaymentStatusForcefully(
        tenMinutesAhead.toISOString(),
        fiveMinutesAhead.toISOString()
      );
      for (const obj of paymentData) {
        if (obj.paymentType == "stripe") {
          const session = await stripe.checkout.sessions.retrieve(
            obj.paymentId
          );
          if (
            session.payment_status == "paid" &&
            obj.paymentStatus == "pending"
          ) {
            await paymentRepo.update200ttcPayment(
              { paymentStatus: "paid", isPaymentCheck: true },
              obj._id
            );
            await helper.send200TTCEmail(obj);

            // Track purchase event with Meta Conversions API
            paymentTrackingService.track200TTCPurchase(
              {
                paymentId: session.payment_intent,
                clientIp: "",
                userAgent: "",
                fbc: "",
                fbp: "",
              },
              {
                email: obj.email,
                phoneNumber: obj.phoneNumber,
                name: obj.name,
                price: obj.price,
                currency: obj.currency,
              }
            );
          } else {
            await paymentRepo.update200ttcPayment(
              { isPaymentCheck: true },
              obj._id
            );
            await helper.complete200TTCEmail(obj);
          }
        } else {
          const payments = await razorpay.orders.fetchPayments(obj.paymentId);
          if (
            payments.items &&
            payments.items.length > 0 &&
            obj.paymentStatus == "pending"
          ) {
            const payment = payments.items[0];
            if (payment.status === "captured") {
              const generatedSignature = crypto
                .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
                .update(obj.paymentId + "|" + payment.id)
                .digest("hex");
              if (
                generatedSignature === payment.signature ||
                !payment.signature
              ) {
                await paymentRepo.update200ttcPayment(
                  { paymentStatus: "paid", isPaymentCheck: true },
                  obj._id
                );
                await helper.send200TTCEmail(obj);

                // Track purchase event with Meta Conversions API
                paymentTrackingService.track200TTCPurchase(
                  {
                    paymentId: payment.id,
                    clientIp: "",
                    userAgent: "",
                    fbc: "",
                    fbp: "",
                  },
                  {
                    email: obj.email,
                    phoneNumber: obj.phoneNumber,
                    name: obj.name,
                    price: obj.price,
                    currency: obj.currency,
                  }
                );
              }
            }
          } else {
            await paymentRepo.update200ttcPayment(
              { isPaymentCheck: true },
              obj._id
            );
            await helper.complete200TTCEmail(obj);
          }
        }
      }
      resolve(1);
    } catch (error) {
      return reject(error);
    }
  });
}
function checkoutRazorpayNewSwarSadhana(reqBody) {
  return new Promise(async (resolve, reject) => {
    try {
      const { price, userId, currency } = reqBody;
      const paymentData = {
        price,
        userId,
        currency,
      };
      const pay = await paymentRepo.webinnerUpdateById(paymentData.userId, {
        priceId: paymentData.priceId,
      });
      const options = {
        amount: price * 100,
        currency: currency,
        receipt: "swara_" + Date.now(),
        payment_capture: 1,
      };
      const order = await razorpay.orders.create(options);
      await paymentRepo.webinnerUpdateById(paymentData.userId, {
        paymentId: order.id,
      });
      resolve({
        success: true,
        orderId: order.id,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
        payDbId: pay._id,
        amount: order.amount,
        currency: order.currency,
      });
    } catch (error) {
      return reject(error);
    }
  });
}
function updateSwaraSadhanaPaymentStatusForcefully() {
  return new Promise(async (resolve, reject) => {
    try {
      const now = new Date();
      const fiveMinutesAhead = new Date(now.getTime() - 3 * 60 * 1000);
      const tenMinutesAhead = new Date(now.getTime() - 10 * 60 * 1000);
      const paymentData =
        await paymentRepo.updateSwaraSadhanaPaymentStatusForcefully(
          tenMinutesAhead.toISOString(),
          fiveMinutesAhead.toISOString()
        );
      for (const obj of paymentData) {
        if (obj.paymentType == "stripe") {
          const session = await stripe.checkout.sessions.retrieve(
            obj.paymentId
          );
          if (session.payment_status == "paid") {
            await paymentRepo.webinnerUpdateById(obj._id, {
              paymentStatus: "paid",
              isPaymentCheck: true,
            });
            await helper.sendSwaraSadhnaEmail(
              {
                name: obj.name,
                webinar: obj.webinar,
                email: obj.email,
                password: obj.password,
              },
              obj.email
            );
          } else {
            await paymentRepo.webinnerUpdateById(obj._id, {
              isPaymentCheck: true,
            });
            await helper.completeSwaraSadhanaEmail(obj);
          }
        } else {
          const payments = await razorpay.orders.fetchPayments(obj.paymentId);
          if (payments.items && payments.items.length > 0) {
            const payment = payments.items[0];
            if (payment.status === "captured") {
              const generatedSignature = crypto
                .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
                .update(obj.paymentId + "|" + payment.id)
                .digest("hex");
              if (
                generatedSignature === payment.signature ||
                !payment.signature
              ) {
                await paymentRepo.webinnerUpdateById(obj._id, {
                  paymentStatus: "paid",
                  isPaymentCheck: true,
                });
                await helper.sendSwaraSadhnaEmail(
                  {
                    name: obj.name,
                    webinar: obj.webinar,
                    email: obj.email,
                    password: obj.password,
                  },
                  obj.email
                );
              }
            }
          } else {
            await paymentRepo.webinnerUpdateById(obj._id, {
              isPaymentCheck: true,
            });
            await helper.completeSwaraSadhanaEmail(obj);
          }
        }
      }
      resolve(1);
    } catch (error) {
      return reject(error);
    }
  });
}
function checkoutSwarSadhanaStripe(reqBody) {
  return new Promise(async (resolve, reject) => {
    try {
      let paymentData = {
        priceId: reqBody.priceId,
        userId: reqBody.userId,
      };
      const pay = await paymentRepo.webinnerUpdateById(paymentData.userId, {
        priceId: paymentData.priceId,
      });
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price: reqBody.priceId,
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: process.env.STRIP_URL,
        cancel_url: process.env.STRIP_URL,
        customer_email: reqBody.custEmail,
      });
      await paymentRepo.webinnerUpdateById(paymentData.userId, {
        paymentId: session.id,
      });
      resolve({
        sessionId: session.id,
        payDbId: pay._id,
        url: session.url,
      });
    } catch (error) {
      return reject(error);
    }
  });
}
function checkoutRazorpayForLiveClasses(reqBody) {
  return new Promise(async (resolve, reject) => {
    try {
      const paymentData = {
        name: reqBody.name,
        email: reqBody.email,
        phone: reqBody.phone,
        currency: reqBody.currency,
        price: reqBody.price,
        paymentStatus: "pending",
        courses: reqBody.courses,
        paymentType: "razorpay",
      };
      const pay = await studentRepo.createLiveClassData(paymentData);
      const order = await razorpay.orders.create({
        amount: reqBody.price * 100,
        currency: reqBody.currency,
        receipt: `LiveClass_${pay._id}`,
        notes: { dbId: pay._id.toString() },
      });
      await paymentRepo.liveCourseUpdateById(pay._id, {
        paymentId: order.id,
      });
      resolve({
        key: process.env.RAZORPAY_KEY_ID,
        orderId: order.id,
        payDbId: pay._id,
      });
    } catch (error) {
      return reject(error);
    }
  });
}
function checkoutStripeForLiveClasses(reqBody) {
  return new Promise(async (resolve, reject) => {
    try {
      let paymentData = {
        name: reqBody.name,
        email: reqBody.email,
        paymentStatus: "pending",
        price: reqBody.price,
        currency: reqBody.currency,
        phone: reqBody.phone,
        courses: reqBody.courses,
        paymentType: "stripe",
      };
      const pay = await studentRepo.createLiveClassData(paymentData);
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
      await paymentRepo.liveCourseUpdateById(pay._id, {
        paymentId: session.id,
      });
      resolve({
        sessionId: session.id,
        payDbId: pay._id,
        url: session.url,
      });
    } catch (error) {
      return reject(error);
    }
  });
}
function updateOnlineSadhanaPaymentStatusForcefully() {
  return new Promise(async (resolve, reject) => {
    try {
      const mentors = await courseRepo.getCourseBySlug("online-yoga-classes");
      const now = new Date();
      const fiveMinutesAhead = new Date(now.getTime() - 3 * 60 * 1000);
      const tenMinutesAhead = new Date(now.getTime() - 10 * 60 * 1000);
      const paymentData =
        await paymentRepo.updateOnlineSadhanaPaymentStatusForcefully(
          tenMinutesAhead.toISOString(),
          fiveMinutesAhead.toISOString()
        );
      for (const obj of paymentData) {
        if (obj.paymentType == "stripe") {
          const session = await stripe.checkout.sessions.retrieve(
            obj.paymentId
          );
          if (session.payment_status == "paid") {
            await paymentRepo.liveCourseUpdateById(obj._id, {
              paymentStatus: "paid",
              isPaymentCheck: true,
            });
            // Track Live Class purchase (Stripe - forced status check)
            try {
              await paymentTrackingService.trackLiveClassPurchase(
                {
                  paymentId: session.payment_intent,
                  clientIp: "",
                  userAgent: "",
                },
                {
                  email: obj.email,
                  phone: obj.phone,
                  name: obj.name,
                  price: obj.price,
                  currency: obj.currency,
                }
              );
            } catch (e) {
              console.error(
                "Live Class purchase tracking (Stripe force) failed:",
                e?.message || e
              );
            }
            for (let coursObj of obj.courses) {
              var item = mentors.teachersData.find(
                (obj) => coursObj.id == obj.id
              );

              if (item) {
                await helper.sendLiveCourseEmail(
                  {
                    NAME: obj.name,
                    ZOOM: item.zoomLink,
                    MID: item.meetingId,
                    PASSCODE: item.passcode,
                    WHATSAPP: item.whatsappLink,
                  },
                  obj.email,
                  `/emailTemplate/${item.emailTemplate}`,
                  item.subject
                );
              }
            }
          } else {
            await paymentRepo.liveCourseUpdateById(obj._id, {
              isPaymentCheck: true,
            });
            await helper.completeOnlineSadhanaEmail(obj);
          }
        } else {
          const payments = await razorpay.orders.fetchPayments(obj.paymentId);
          if (payments.items && payments.items.length > 0) {
            const payment = payments.items[0];
            if (payment.status === "captured") {
              const generatedSignature = crypto
                .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
                .update(obj.paymentId + "|" + payment.id)
                .digest("hex");
              if (
                generatedSignature === payment.signature ||
                !payment.signature
              ) {
                await paymentRepo.liveCourseUpdateById(obj._id, {
                  paymentStatus: "paid",
                  isPaymentCheck: true,
                });
                // Track Live Class purchase (Razorpay - forced status check)
                try {
                  await paymentTrackingService.trackLiveClassPurchase(
                    {
                      paymentId: payment.id,
                      clientIp: "",
                      userAgent: "",
                    },
                    {
                      email: obj.email,
                      phone: obj.phone,
                      name: obj.name,
                      price: obj.price,
                      currency: obj.currency,
                    }
                  );
                } catch (e) {
                  console.error(
                    "Live Class purchase tracking (Razorpay force) failed:",
                    e?.message || e
                  );
                }
                for (let coursObj of obj.courses) {
                  var item = mentors.teachersData.find(
                    (obj) => coursObj.id == obj.id
                  );
                  if (item) {
                    await helper.sendLiveCourseEmail(
                      {
                        NAME: obj.name,
                        ZOOM: item.zoomLink,
                        MID: item.meetingId,
                        PASSCODE: item.passcode,
                        WHATSAPP: item.whatsappLink,
                      },
                      obj.email,
                      `/emailTemplate/${item.emailTemplate}`,
                      item.subject
                    );
                  }
                }
              }
            }
          } else {
            await paymentRepo.liveCourseUpdateById(obj._id, {
              isPaymentCheck: true,
            });
            await helper.completeOnlineSadhanaEmail(obj);
          }
        }
      }
      resolve(1);
    } catch (error) {
      return reject(error);
    }
  });
}
function checkoutRazorpayNewPranaarabha(reqBody) {
  return new Promise(async (resolve, reject) => {
    try {
      const {
        courseId,
        studentId,
        paymentStatus,
        paymentBy,
        price,
        currency,
        email,
      } = reqBody;
      const paymentData = {
        courseId,
        studentId,
        paymentStatus,
        paymentBy,
      };
      const pay = await paymentRepo.createPaymentDetails(paymentData);
      const options = {
        amount: price * 100,
        currency: currency || "INR",
        receipt: "pranaarabha_" + Date.now(),
        payment_capture: 1,
      };
      const order = await razorpay.orders.create(options);
      await paymentRepo.updatePranaArambhPaymentUserData(pay._id, {
        paymentId: order.id,
      });
      resolve({
        success: true,
        orderId: order.id,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
        payDbId: pay._id,
        amount: order.amount,
        currency: order.currency,
      });
    } catch (error) {
      return reject(error);
    }
  });
}
function checkoutStripe(reqBody) {
  return new Promise(async (resolve, reject) => {
    try {
      let paymentData = {
        courseId: reqBody.courseId,
        studentId: reqBody.studentId,
        paymentStatus: reqBody.paymentStatus,
        paymentBy: reqBody.paymentBy,
      };
      const pay = await paymentRepo.createPaymentDetails(paymentData);
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price: reqBody.priceId,
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: process.env.STRIP_URL,
        cancel_url: process.env.STRIP_URL,
        customer_email: reqBody.custEmail,
      });
      await paymentRepo.updatePranaArambhPaymentUserData(pay._id, {
        paymentId: session.id,
      });
      resolve({
        sessionId: session.id,
        payDbId: pay._id,
        url: session.url,
      });
    } catch (error) {
      return reject(error);
    }
  });
}
function updatePranaArambhPaymentStatusForcefully() {
  return new Promise(async (resolve, reject) => {
    try {
      const now = new Date();
      const fiveMinutesAhead = new Date(now.getTime() - 1 * 60 * 1000);
      const tenMinutesAhead = new Date(now.getTime() - 40 * 60 * 1000);
      let course = constants.COURSE.PRANA_ARAMBHA;
      const paymentData =
        await paymentRepo.updatePranaArambhPaymentStatusForcefully(
          tenMinutesAhead.toISOString(),
          fiveMinutesAhead.toISOString()
        );
      for (const obj of paymentData) {
        let coursetitle = await courseRepo.getCourseById(course);
        let studentData = await studentRepo.getStudentById(obj.studentId);
        if (obj.paymentBy == "Stripe") {
          const session = await stripe.checkout.sessions.retrieve(
            obj.paymentId
          );
          if (session.payment_status == "paid") {
            await paymentRepo.updatePranaArambhPaymentUserData(obj._id, {
              paymentStatus: "paid",
              isPaymentCheck: true,
            });
            if (
              studentData.paymentCourseId ==
              constants.COURSE.FOUNDATION_SPIRITUALITY
            ) {
              await helper.completeFoundationOfSpiritualityMail({
                firstName: studentData.firstName,
                email: studentData.email,
                password: studentData.password,
              });
              course = studentData.paymentCourseId;
            } else {
              let date = new Date();
              let replacement = {
                name: studentData.firstName,
                course: coursetitle,
                email: studentData.email,
                date: date.toString(),
                password: studentData.password,
              };
              await helper.sendPranaArambhEmail(replacement);
            }
            let updatedCourses = studentData.course.includes(course)
              ? studentData.course
              : [...studentData.course, course];
            await studentRepo.updateStudentCourse(
              obj.studentId,
              updatedCourses
            );
          } else {
            await paymentRepo.updatePranaArambhPaymentUserData(obj._id, {
              isPaymentCheck: true,
            });
            if (
              studentData.paymentCourseId ==
              constants.COURSE.FOUNDATION_SPIRITUALITY
            ) {
              await helper.completefOSEmail(studentData);
            } else {
              await helper.completePranaArambhEmail(studentData);
            }
            // let updatedCourses = studentData.course.includes(course)
            //   ? studentData.course
            //   : [...studentData.course, course];
            // await studentRepo.updateStudentCourse(
            //   obj.studentId,
            //   updatedCourses
            // );
          }
        } else {
          const payments = await razorpay.orders.fetchPayments(obj.paymentId);
          if (payments.items && payments.items.length > 0) {
            const payment = payments.items[0];
            if (payment.status === "captured") {
              const generatedSignature = crypto
                .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
                .update(obj.paymentId + "|" + payment.id)
                .digest("hex");
              if (
                generatedSignature === payment.signature ||
                !payment.signature
              ) {
                await paymentRepo.updatePranaArambhPaymentUserData(obj._id, {
                  paymentStatus: "paid",
                  isPaymentCheck: true,
                });
                if (
                  studentData.paymentCourseId ==
                  constants.COURSE.FOUNDATION_SPIRITUALITY
                ) {
                  await helper.completeFoundationOfSpiritualityMail({
                    firstName: studentData.firstName,
                    email: studentData.email,
                    password: studentData.password,
                  });
                  course = studentData.paymentCourseId;
                } else {
                  let date = new Date();
                  let replacement = {
                    name: studentData.firstName,
                    course: coursetitle,
                    email: studentData.email,
                    date: date.toString(),
                    password: studentData.password,
                  };
                  await helper.sendPranaArambhEmail(replacement);
                }
                let updatedCourses = studentData.course.includes(course)
                  ? studentData.course
                  : [...studentData.course, course];
                await studentRepo.updateStudentCourse(
                  obj.studentId,
                  updatedCourses
                );
              }
            }
          } else {
            await paymentRepo.updatePranaArambhPaymentUserData(obj._id, {
              isPaymentCheck: true,
            });
            if (
              studentData.paymentCourseId ==
              constants.COURSE.FOUNDATION_SPIRITUALITY
            ) {
              await helper.completefOSEmail(studentData);
            } else {
              await helper.completePranaArambhEmail(studentData);
            }
            // let updatedCourses = studentData.course.includes(course)
            //   ? studentData.course
            //   : [...studentData.course, course];
            // await studentRepo.updateStudentCourse(
            //   obj.studentId,
            //   updatedCourses
            // );
          }
        }
      }
      resolve(1);
    } catch (error) {
      return reject(error);
    }
  });
}
function updateabc() {
  return new Promise(async (resolve, reject) => {
    try {
      const id = constants.COURSE.BREATCH_DTOX;
      const d = await studentRepo.abc(id);
      for (let obj of d) {
        if (obj.course.length == 1 && obj.course[0] == id) {
          // await studentRepo.updateStudent({
          //   _id: obj._id,
          //   paymentCourseId: id,
          // });
          console.log("mdntasssk", obj.course);
        }
      }
      resolve(1);
    } catch (error) {
      return reject(error);
    }
  });
}
function createPranicPurificationStudent(user, password) {
  return new Promise(async (resolve, reject) => {
    try {
      let studentData = {
        email: user.email,
        firstName: user.name,
        isActive: true,
        password: password,
        phoneNumber: user.phoneNumber,
        course: [constants.COURSE.PRANIC_PURIFICATION],
        source: constants.STUDENT_SOURCCE.PRANIC + user._id,
        paymentCourseId: constants.COURSE.PRANIC_PURIFICATION,
      };
      let responseStudent = await studentRepo.createStudent(studentData);
      return resolve(responseStudent);
    } catch (error) {
      return reject(error);
    }
  });
}
function updatePranicPurificationStatusForcefully() {
  return new Promise(async (resolve, reject) => {
    try {
      const now = new Date();
      const fiveMinutesAhead = new Date(now.getTime() - 1 * 60 * 1000);
      const tenMinutesAhead = new Date(now.getTime() - 10 * 60 * 1000);
      const paymentData =
        await paymentRepo.updatePranicPurificationStatusForcefully(
          tenMinutesAhead.toISOString(),
          fiveMinutesAhead.toISOString()
        );
      for (const obj of paymentData) {
        const password = helper.genratePass(6);
        if (obj.paymentType == "stripe") {
          const session = await stripe.checkout.sessions.retrieve(
            obj.paymentId
          );
          if (session.payment_status == "paid") {
            await paymentRepo.pranicPurificationUpdateById(obj._id, {
              paymentStatus: "paid",
              isPaymentCheck: true,
            });
            createPranicPurificationStudent(obj, password);
            helper.completePranicPurificationAutomationEmail(obj, password);
          } else {
            await paymentRepo.pranicPurificationUpdateById(obj._id, {
              isPaymentCheck: true,
            });
            await helper.completePranicPurificationEmail(obj);
          }
        } else {
          const payments = await razorpay.orders.fetchPayments(obj.paymentId);
          if (payments.items && payments.items.length > 0) {
            const payment = payments.items[0];
            if (payment.status === "captured") {
              const generatedSignature = crypto
                .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
                .update(obj.paymentId + "|" + payment.id)
                .digest("hex");
              if (
                generatedSignature === payment.signature ||
                !payment.signature
              ) {
                await paymentRepo.pranicPurificationUpdateById(obj._id, {
                  paymentStatus: "paid",
                  isPaymentCheck: true,
                });
                createPranicPurificationStudent(obj, password);
                helper.completePranicPurificationAutomationEmail(obj, password);
              }
            }
          } else {
            await paymentRepo.pranicPurificationUpdateById(obj._id, {
              isPaymentCheck: true,
            });
            await helper.completePranicPurificationEmail(obj);
          }
        }
      }
      resolve(1);
    } catch (error) {
      return reject(error);
    }
  });
}
function updateRishikeshStatusForcefully() {
  return new Promise(async (resolve, reject) => {
    try {
      const now = new Date();
      const fiveMinutesAhead = new Date(now.getTime() - 1 * 60 * 1000);
      const tenMinutesAhead = new Date(now.getTime() - 50 * 60 * 1000);
      const paymentData = await paymentRepo.updateRishikeshStatusForcefully(
        tenMinutesAhead.toISOString(),
        fiveMinutesAhead.toISOString()
      );
      for (const obj of paymentData) {
        if (obj.paymentType == "stripe") {
          const session = await stripe.checkout.sessions.retrieve(
            obj.paymentId
          );
          if (session.payment_status == "paid") {
            await paymentRepo.rishikeshUpdateById(obj._id, {
              paymentStatus: "paid",
              isPaymentCheck: true,
            });
            helper.sendRishikeshCourseEmail(obj);
          } else {
            await paymentRepo.rishikeshUpdateById(obj._id, {
              isPaymentCheck: true,
            });
            await helper.completeRishikeshEmail(obj);
          }
        } else {
          const payments = await razorpay.orders.fetchPayments(obj.paymentId);
          if (payments.items && payments.items.length > 0) {
            const payment = payments.items[0];
            if (payment.status === "captured") {
              const generatedSignature = crypto
                .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
                .update(obj.paymentId + "|" + payment.id)
                .digest("hex");
              if (
                generatedSignature === payment.signature ||
                !payment.signature
              ) {
                await paymentRepo.rishikeshUpdateById(obj._id, {
                  paymentStatus: "paid",
                  isPaymentCheck: true,
                });
                helper.sendRishikeshCourseEmail(obj);
              }
            }
          } else {
            await paymentRepo.rishikeshUpdateById(obj._id, {
              isPaymentCheck: true,
            });
            await helper.completeRishikeshEmail(obj);
          }
        }
      }
      resolve(1);
    } catch (error) {
      return reject(error);
    }
  });
}
function checkoutStripeForBali(reqBody) {
  return new Promise(async (resolve, reject) => {
    try {
      reqBody.paymentType = "stripe";
      let pay = await paymentRepo.createBaliData(reqBody);
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: reqBody.currency,
              unit_amount: parseInt(parseFloat(reqBody.price) * 100),
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
      await paymentRepo.baliUpdateById(pay._id, {
        paymentId: session.id,
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
function getStripePaymentResultBali(reqBody) {
  return new Promise(async (resolve, reject) => {
    try {
      const session = await stripe.checkout.sessions.retrieve(
        reqBody.sessionId
      );
      if (session.payment_status == "paid") {
        const user = await paymentRepo.updateBaliStudentData(
          reqBody.payDbId,
          session.payment_intent,
          true
        );
        await helper.sendBaliCourseEmail(user);
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
        await paymentRepo.updateBaliStudentData(reqBody.payDbId, null, false);
        return resolve({
          status: 200,
          data: {
            status: "failed",
            sessionId: reqBody.sessionId,
          },
        });
      }
    } catch (error) {
      return reject(error);
    }
  });
}
function updateBaliStatusForcefully() {
  return new Promise(async (resolve, reject) => {
    try {
      const now = new Date();
      const fiveMinutesAhead = new Date(now.getTime() - 1 * 60 * 1000);
      const tenMinutesAhead = new Date(now.getTime() - 50 * 60 * 1000);
      const paymentData = await paymentRepo.updateBaliStatusForcefully(
        tenMinutesAhead.toISOString(),
        fiveMinutesAhead.toISOString()
      );
      for (const obj of paymentData) {
        if (obj.paymentType == "stripe") {
          const session = await stripe.checkout.sessions.retrieve(
            obj.paymentId
          );
          if (session.payment_status == "paid") {
            await paymentRepo.baliUpdateById(obj._id, {
              paymentStatus: "paid",
              isPaymentCheck: true,
            });
            helper.sendBaliCourseEmail(obj);
          } else {
            await paymentRepo.baliUpdateById(obj._id, {
              isPaymentCheck: true,
            });
            await helper.completeBaliEmail(obj);
          }
        }
        // else {
        //   const payments = await razorpay.orders.fetchPayments(obj.paymentId);
        //   if (payments.items && payments.items.length > 0) {
        //     const payment = payments.items[0];
        //     if (payment.status === "captured") {
        //       const generatedSignature = crypto
        //         .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        //         .update(obj.paymentId + "|" + payment.id)
        //         .digest("hex");
        //       if (
        //         generatedSignature === payment.signature ||
        //         !payment.signature
        //       ) {
        //         await paymentRepo.rishikeshUpdateById(obj._id, {
        //           paymentStatus: "paid",
        //           isPaymentCheck: true,
        //         });
        //         helper.sendRishikeshCourseEmail(obj);
        //       }
        //     }
        //   } else {
        //     await paymentRepo.rishikeshUpdateById(obj._id, {
        //       isPaymentCheck: true,
        //     });
        //     await helper.completeRishikeshEmail(obj);
        //   }
        // }
      }
      resolve(1);
    } catch (error) {
      return reject(error);
    }
  });
}
module.exports = {
  updateabc,
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
  updatePaymentId200ttc,
  updatePaymentStatusForcefully,
  checkoutRazorpayNewSwarSadhana,
  updateSwaraSadhanaPaymentStatusForcefully,
  checkoutSwarSadhanaStripe,
  checkoutRazorpayForLiveClasses,
  checkoutStripeForLiveClasses,
  updateOnlineSadhanaPaymentStatusForcefully,
  checkoutRazorpayNewPranaarabha,
  checkoutStripe,
  updatePranaArambhPaymentStatusForcefully,
  createPranicPurificationStudent,
  updatePranicPurificationStatusForcefully,
  updateRishikeshStatusForcefully,
  checkoutStripeForBali,
  getStripePaymentResultBali,
  updateBaliStatusForcefully,
};
