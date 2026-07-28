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
const { MonthEnum } = require("../models/rishikeshStudent");

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
const PAYPAL_CURRENCY = "USD";
function getPayPalBaseUrl() {
  const explicitBaseUrl = process.env.PAYPAL_BASE_URL;
  if (explicitBaseUrl) {
    return explicitBaseUrl.replace(/\/$/, "");
  }

  const mode = (process.env.PAYPAL_MODE || "sandbox").toLowerCase();
  const baseUrl =
    mode === "live" || mode === "production"
      ? process.env.PAYPAL_LIVE_BASE_URL
      : process.env.PAYPAL_SANDBOX_BASE_URL;

  if (!baseUrl) {
    throw new Error("PayPal base URL is not configured");
  }

  return baseUrl.replace(/\/$/, "");
}

function getPayPalRedirectUrl(pathName) {
  const mainUrl = (process.env.MAIN_URL || "").replace(/\/$/, "");
  if (mainUrl) {
    return `${mainUrl}${pathName}`;
  }
  return process.env.STRIP_URL;
}

function formatPayPalAmount(amount) {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new Error("Invalid PayPal amount");
  }
  return numericAmount.toFixed(2);
}

async function getPayPalAccessToken() {
  if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
    throw new Error("PayPal credentials are not configured");
  }

  const response = await axios.post(
    `${getPayPalBaseUrl()}/v1/oauth2/token`,
    "grant_type=client_credentials",
    {
      auth: {
        username: process.env.PAYPAL_CLIENT_ID,
        password: process.env.PAYPAL_CLIENT_SECRET,
      },
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  );
  return response.data.access_token;
}

async function callPayPal(method, resourcePath, data, requestId) {
  const accessToken = await getPayPalAccessToken();
  const response = await axios({
    method,
    url: `${getPayPalBaseUrl()}${resourcePath}`,
    data,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(requestId ? { "PayPal-Request-Id": requestId } : {}),
    },
  });
  return response.data;
}

function getPayPalApproveUrl(order) {
  return order.links?.find((link) => link.rel === "approve")?.href || "";
}

function getPayPalCapture(order) {
  return order.purchase_units?.[0]?.payments?.captures?.[0] || null;
}

async function capturePayPalOrder(orderId, payDbId) {
  return callPayPal(
    "post",
    `/v2/checkout/orders/${orderId}/capture`,
    {},
    `200TTC-capture-${payDbId}-${orderId}`,
  );
}

async function getPayPalOrder(orderId) {
  return callPayPal("get", `/v2/checkout/orders/${orderId}`);
}

async function completePayPal200TTCPayment(order, reqBody, req) {
  const capture = getPayPalCapture(order);
  if (!capture || capture.status !== "COMPLETED") {
    throw new Error("PayPal payment was not completed");
  }

  const paymentDetails = await paymentRepo.getPaymentDetailsById(
    reqBody.payDbId,
  );
  if (!paymentDetails) {
    throw new Error("Payment record not found");
  }
  const capturedCurrency = String(
    capture.amount?.currency_code || "",
  ).toUpperCase();
  const expectedCurrency = String(paymentDetails.currency || "").toUpperCase();
  const capturedAmount = Number(capture.amount?.value || 0);
  const expectedMaxAmount = Number(paymentDetails.price || 0);
  if (
    capturedCurrency !== expectedCurrency ||
    !Number.isFinite(capturedAmount) ||
    capturedAmount <= 0 ||
    capturedAmount > expectedMaxAmount
  ) {
    throw new Error("PayPal payment amount verification failed");
  }

  const user = await paymentRepo.update200TTCata(
    reqBody.payDbId,
    capture.id,
    true,
    reqBody.installment,
    reqBody.dueAmnt,
  );
  if (reqBody.installment == "2nd") {
    await savePranaArambhOn200TTC(user, reqBody);
  }
  await helper.send200TTCInstalmentEmail(user, reqBody);
  const clientData = req ? extractClientData(req) : {};
  paymentTrackingService.track200TTCPurchase(
    {
      paymentId: capture.id,
      ...clientData,
    },
    user,
  );

  return {
    status: 200,
    data: {
      status: "success",
      paymtId: capture.id,
      amount: Number(capture.amount?.value || user.price || 0),
      currency: capture.amount?.currency_code || user.currency,
    },
  };
}
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
  req,
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
          true,
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
        const clientData = req ? extractClientData(req) : {};
        paymentTrackingService.trackPranicPurificationPurchase(
          {
            paymentId: razorpay_payment_id,
            ...clientData,
          },
          user,
        );
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
function checkoutRazorpayForPranicPurificationII(reqBody) {
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
        courseStartDate: new Date("2026-05-15T00:00:00"),
        courseTimeDuration: "6.30 PM IST",
        paymentType: "razorpay",
      };
      const pay = await paymentRepo.createPranicIIUserData(userData);
      const amountInSubunits = reqBody.price * 100;
      const options = {
        amount: amountInSubunits,
        currency: reqBody.currency,
        receipt: `pranic_II_${pay._id}`,
        payment_capture: 1,
      };
      const order = await razorpay.orders.create(options);
      await paymentRepo.pranicPurificationIIUpdateById(pay._id, {
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
function getRazorPaymentResultPranicPurificationII({
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
  payDbId,
  password,
  req,
}) {
  return new Promise(async (resolve, reject) => {
    try {
      const hmac = crypto.createHmac("sha256", razorpay.key_secret);
      hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
      const generated_signature = hmac.digest("hex");
      if (generated_signature === razorpay_signature) {
        const user = await paymentRepo.updatePranicIIUserData(
          payDbId,
          razorpay_payment_id,
          true,
        );
        const couponCode = generateCouponCode(user.name);
        const couponcodeData = {
          code: couponCode,
          slug: constants.SLUG.PRANA_ARAMBH,
          email: user.email,
          studentId: user._id,
        };
        await paymentRepo.createCouponCodeData(couponcodeData);
        await createPranicPurificationIIStudent(user, password);
        await helper.completePranicPurificationIIAutomationEmail(
          user,
          password,
        );
        const clientData = req ? extractClientData(req) : {};
        paymentTrackingService.trackPranicPurificationIIPurchase(
          {
            paymentId: razorpay_payment_id,
            ...clientData,
          },
          user,
        );
        return resolve({
          status: "success",
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id,
        });
      } else {
        await paymentRepo.updatePranicIIUserData(payDbId, null, false);
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
function checkoutStripeForPranicPurificationII(reqBody) {
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
        courseStartDate: new Date("2026-05-15T00:00:00"),
        courseTimeDuration: "6.30 PM IST",
        paymentType: "stripe",
      };
      const pay = await paymentRepo.createPranicIIUserData(userData);
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
      await paymentRepo.pranicPurificationIIUpdateById(pay._id, {
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
  couponCodeId,
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
      var date = new Date();
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
        // const wspMessage = {
        //   messaging_product: "whatsapp",
        //   to: phoneNumber,
        //   type: "template",
        //   template: {
        //     name: "prana_arambha",
        //     language: { code: "en" },
        //     components: [
        //       {
        //         type: "header",
        //         parameters: [
        //           {
        //             type: "text",
        //             text: firstName,
        //           },
        //         ],
        //       },
        //       {
        //         type: "body",
        //         parameters: [
        //           { type: "text", text: coursetitle },
        //           { type: "text", text: coursetitle },
        //           { type: "text", text: `${amount} ${currency}` },
        //           { type: "text", text: date.toString() },
        //           { type: "text", text: email },
        //           { type: "text", text: password },
        //         ],
        //       },
        //     ],
        //   },
        // };
        // axios
        //   .post(process.env.WHATSAPP_API_URL, wspMessage, {
        //     headers: {
        //       Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        //       "Content-Type": "application/json",
        //     },
        //   })
        //   .then((response) => {
        //     console.log("WhatsApp message sent successfully:", response.data);
        //   })
        //   .catch((error) => {
        //     console.log("WhatsApp message error:", error.message);
        //   });
        const { paymentId } = paymentRepo.getPaymentDetailsById(payDbId);
        let filePath = path.join(
          __dirname,
          "..",
          "controller",
          constants.EMAIL_TEMPLATE.ADMIN_ORDER,
        );
        const source = fs.readFileSync(filePath, "utf-8").toString();
        let template = handlebars.compile(source);
        let htmlToSend = template({
          name: firstName,
          course: coursetitle,
          email: email,
          price: amount,
          payId: paymentId,
          currency: currency,
        });
        let mailOptions = {
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
function getPaymentResultPranicPurification(reqBody, req = null) {
  return new Promise(async (resolve, reject) => {
    try {
      const session = await stripe.checkout.sessions.retrieve(
        reqBody.pranicPurificationSessionId,
      );
      if (session.payment_status == "paid") {
        const user = await paymentRepo.updatePranicUserData(
          reqBody.payDbId,
          session.payment_intent,
          true,
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
          reqBody.password,
        );
        const clientData = req ? extractClientData(req) : {};
        paymentTrackingService.trackPranicPurificationPurchase(
          {
            paymentId: session.payment_intent,
            ...clientData,
          },
          user,
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
function getPaymentResultPranicPurificationII(reqBody, req = null) {
  return new Promise(async (resolve, reject) => {
    try {
      const session = await stripe.checkout.sessions.retrieve(
        reqBody.pranicPurificationSessionId,
      );
      if (session.payment_status == "paid") {
        const user = await paymentRepo.updatePranicIIUserData(
          reqBody.payDbId,
          session.payment_intent,
          true,
        );
        const couponCode = generateCouponCode(user.name);
        const couponcodeData = {
          code: couponCode,
          slug: constants.SLUG.PRANA_ARAMBH,
          email: user.email,
          studentId: user._id,
        };
        await paymentRepo.createCouponCodeData(couponcodeData);
        createPranicPurificationIIStudent(user, reqBody.password);
        helper.completePranicPurificationIIAutomationEmail(
          user,
          reqBody.password,
        );
        const clientData = req ? extractClientData(req) : {};
        paymentTrackingService.trackPranicPurificationIIPurchase(
          {
            paymentId: session.payment_intent,
            ...clientData,
          },
          user,
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
        await paymentRepo.updatePranicIIUserData(reqBody.payDbId, null, false);
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
          reqBody.price,
        );
      } else {
        let userData = {
          name: reqBody.name,
          email: reqBody.email,
          phoneNumber: reqBody.phoneNumber,
          package: reqBody.package,
          room: reqBody.room,
          dueAmount: reqBody.dueAmount,
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
          reqBody.dueAmnt,
        );
        if (reqBody.installment == "2nd") {
          await savePranaArambhOn200TTC(user, reqBody);
        }
        await helper.send200TTCInstalmentEmail(user, reqBody);
        const clientData = req ? extractClientData(req) : {};
        paymentTrackingService.track200TTCPurchase(
          {
            paymentId: reqBody.razorpayPaymentId,
            ...clientData,
          },
          user,
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
          reqBody.price,
        );
      } else {
        let userData = {
          name: reqBody.name,
          email: reqBody.email,
          phoneNumber: reqBody.phoneNumber,
          package: reqBody.package,
          room: reqBody.room,
          dueAmount: reqBody.dueAmount,
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
function checkoutPaypalFor200TTC(reqBody) {
  return new Promise(async (resolve, reject) => {
    try {
      const currency = PAYPAL_CURRENCY;
      const amount = formatPayPalAmount(reqBody.price);
      let pay;
      if (reqBody.id) {
        pay = await paymentRepo.updateInstallmentPayment200TTCata(
          reqBody.id,
          reqBody.price,
          { currency, paymentType: "paypal" },
        );
      } else {
        let userData = {
          name: reqBody.name,
          email: reqBody.email,
          phoneNumber: reqBody.phoneNumber,
          package: reqBody.package,
          room: reqBody.room,
          dueAmount: reqBody.dueAmount,
          currency: currency,
          price: amount,
          courseStartDate: reqBody.courseStartDate,
          courseTimeDuration: reqBody.courseTimeDuration,
          paymentType: "paypal",
        };
        pay = await paymentRepo.create200TTCData(userData);
      }

      const order = await callPayPal(
        "post",
        "/v2/checkout/orders",
        {
          intent: "CAPTURE",
          purchase_units: [
            {
              reference_id: `200TTC_${pay._id}`,
              custom_id: String(pay._id),
              description: "200 Hours Yoga TTC Payment",
              amount: {
                currency_code: currency,
                value: amount,
              },
            },
          ],
          application_context: {
            brand_name: "Yoga Vidya School",
            shipping_preference: "NO_SHIPPING",
            user_action: "PAY_NOW",
            return_url: getPayPalRedirectUrl("/confirmation"),
            cancel_url: getPayPalRedirectUrl(
              "/checkout/200-hours-yoga-teacher-training-online",
            ),
          },
        },
        `200TTC-create-${pay._id}`,
      );

      const approvalUrl = getPayPalApproveUrl(order);
      if (!order.id || !approvalUrl) {
        throw new Error("PayPal approval URL was not returned");
      }

      await paymentRepo.update200ttcPayment({ paymentId: order.id }, pay._id);
      return resolve({
        orderId: order.id,
        payDbId: pay._id,
        approvalUrl,
      });
    } catch (error) {
      return reject(error);
    }
  });
}

function getPaypalPaymentResult200TTC(reqBody, req = null) {
  return new Promise(async (resolve, reject) => {
    try {
      const payDbId = reqBody.payDbId;
      const paypalOrderId = reqBody.paypalOrderId;
      const paymentDetails = await paymentRepo.getPaymentDetailsById(payDbId);
      if (!paymentDetails) {
        return resolve({
          status: 404,
          data: { status: "failed", message: "Payment record not found" },
        });
      }
      if (paymentDetails.paymentStatus === "paid") {
        return resolve({
          status: 200,
          data: {
            status: "success",
            paymtId: paymentDetails.paymentId,
            amount: Number(paymentDetails.price || 0),
            currency: paymentDetails.currency,
          },
        });
      }
      if (paymentDetails.paymentId !== paypalOrderId) {
        return resolve({
          status: 400,
          data: { status: "failed", message: "PayPal order mismatch" },
        });
      }

      const order = await getPayPalOrder(paypalOrderId);
      if (order.status === "COMPLETED") {
        const returnData = await completePayPal200TTCPayment(
          order,
          reqBody,
          req,
        );
        return resolve(returnData);
      }
      if (order.status !== "APPROVED") {
        return resolve({
          status: 200,
          data: { status: "failed", paypalOrderId },
        });
      }

      const capturedOrder = await capturePayPalOrder(paypalOrderId, payDbId);
      const returnData = await completePayPal200TTCPayment(
        capturedOrder,
        reqBody,
        req,
      );
      return resolve(returnData);
    } catch (error) {
      return reject(error);
    }
  });
}
function getStripePaymentResult200TTC(reqBody, req = null) {
  return new Promise(async (resolve, reject) => {
    try {
      const session = await stripe.checkout.sessions.retrieve(
        reqBody.sessionId,
      );
      if (session.payment_status == "paid") {
        const user = await paymentRepo.update200TTCata(
          reqBody.payDbId,
          session.payment_intent,
          true,
          reqBody.installment,
          reqBody.dueAmnt,
        );
        if (reqBody.installment == "2nd") {
          await savePranaArambhOn200TTC(user, reqBody);
        }
        await helper.send200TTCInstalmentEmail(user, reqBody);
        const clientData = req ? extractClientData(req) : {};
        paymentTrackingService.track200TTCPurchase(
          {
            paymentId: session.payment_intent,
            ...clientData,
          },
          user,
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
    let studentData;
    try {
      if (user.phoneNumber == "N/A") {
        studentData = {
          email: user.email,
          firstName: user.name,
          isActive: true,
          password: reqBody.password,
          course: [
            constants.COURSE.TWO_THOUSANDS_TTC,
            constants.COURSE.PRANA_ARAMBHA,
            constants.COURSE.BREATCH_DTOX,
          ],
          source: `200TTC_${user._id}_November, 2026`,
          paymentCourseId: constants.COURSE.TWO_THOUSANDS_TTC,
        };
      } else {
        studentData = {
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
          source: `200TTC_${user._id}_November, 2026`,
          paymentCourseId: constants.COURSE.TWO_THOUSANDS_TTC,
        };
      }
      await studentRepo.createStudent(studentData);
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
        Fortnight,
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
function getRazorPaymentResultRishikesh(reqBody, req = null) {
  return new Promise(async (resolve, reject) => {
    try {
      const hmac = crypto.createHmac("sha256", razorpay.key_secret);
      hmac.update(reqBody.razorpayOrderId + "|" + reqBody.razorpayPaymentId);
      const generatedSignature = hmac.digest("hex");
      if (generatedSignature === reqBody.razorpaySignature) {
        const user = await paymentRepo.updateRishikeshStudentData(
          reqBody.payDbId,
          reqBody.razorpayPaymentId,
          true,
        );
        await helper.sendRishikeshCourseEmail(user);
        const clientData = req ? extractClientData(req) : {};
        paymentTrackingService.trackRishikeshPurchase(
          {
            paymentId: reqBody.razorpayPaymentId,
            ...clientData,
          },
          user,
        );
        return resolve({
          amount: +user.price,
          currency: user.currency,
        });
      } else {
        await paymentRepo.updateRishikeshStudentData(
          reqBody.payDbId,
          null,
          false,
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
function getStripePaymentResultRishikesh(reqBody, req = null) {
  return new Promise(async (resolve, reject) => {
    try {
      const session = await stripe.checkout.sessions.retrieve(
        reqBody.sessionId,
      );
      if (session.payment_status == "paid") {
        const user = await paymentRepo.updateRishikeshStudentData(
          reqBody.payDbId,
          session.payment_intent,
          true,
        );
        await helper.sendRishikeshCourseEmail(user);
        const clientData = req ? extractClientData(req) : {};
        paymentTrackingService.trackRishikeshPurchase(
          {
            paymentId: session.payment_intent,
            ...clientData,
          },
          user,
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
        await paymentRepo.updateRishikeshStudentData(
          reqBody.payDbId,
          null,
          false,
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
      const fiveMinutesAhead = new Date(now.getTime() - 1 * 60 * 1000);
      const tenMinutesAhead = new Date(now.getTime() - 10 * 60 * 1000);
      const paymentData = await paymentRepo.updatePaymentStatusForcefully(
        tenMinutesAhead.toISOString(),
        fiveMinutesAhead.toISOString(),
      );
      for (const obj of paymentData) {
        if (obj.paymentType == "stripe") {
          const session = await stripe.checkout.sessions.retrieve(
            obj.paymentId,
          );
          if (
            session.payment_status == "paid" &&
            obj.paymentStatus == "pending"
          ) {
            await paymentRepo.update200ttcPayment(
              { paymentStatus: "paid", isPaymentCheck: true },
              obj._id,
            );
            const reqBody = {
              password: helper.genratePass(6),
              installment: "2nd",
            };
            await savePranaArambhOn200TTC(obj, reqBody);
            await helper.send200TTCInstalmentEmail(obj, reqBody);
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
              },
            );
          } else {
            await paymentRepo.update200ttcPayment(
              { isPaymentCheck: true },
              obj._id,
            );
            await helper.complete200TTCEmail(obj);
          }
        } else if (obj.paymentType == "paypal") {
          const reqBody = {
            payDbId: obj._id,
            paypalOrderId: obj.paymentId,
            password: helper.genratePass(6),
            installment: "2nd",
            dueAmnt: 0,
          };
          const order = await getPayPalOrder(obj.paymentId);
          if (order.status === "APPROVED") {
            const capturedOrder = await capturePayPalOrder(
              obj.paymentId,
              obj._id,
            );
            await completePayPal200TTCPayment(capturedOrder, reqBody, null);
            await paymentRepo.update200ttcPayment(
              { isPaymentCheck: true },
              obj._id,
            );
          } else if (order.status === "COMPLETED") {
            await completePayPal200TTCPayment(order, reqBody, null);
            await paymentRepo.update200ttcPayment(
              { isPaymentCheck: true },
              obj._id,
            );
          } else {
            await paymentRepo.update200ttcPayment(
              { isPaymentCheck: true },
              obj._id,
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
                  obj._id,
                );
                const reqBody = {
                  password: helper.genratePass(6),
                  installment: "2nd",
                };
                await savePranaArambhOn200TTC(obj, reqBody);
                await helper.send200TTCInstalmentEmail(obj, reqBody);
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
                  },
                );
              }
            }
          } else {
            await paymentRepo.update200ttcPayment(
              { isPaymentCheck: true },
              obj._id,
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
          fiveMinutesAhead.toISOString(),
        );
      for (const obj of paymentData) {
        if (obj.paymentType == "stripe") {
          const session = await stripe.checkout.sessions.retrieve(
            obj.paymentId,
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
              obj.email,
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
                  obj.email,
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
        month: reqBody.month,
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
        month: reqBody.month,
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

// ─── Live Classes PayPal ────────────────────────────────────────────────

function checkoutPaypalForLiveClasses(reqBody) {
  return new Promise(async (resolve, reject) => {
    try {
      const currency = PAYPAL_CURRENCY;
      const amount = formatPayPalAmount(reqBody.price);
      let paymentData = {
        name: reqBody.name,
        email: reqBody.email,
        paymentStatus: "pending",
        price: amount,
        currency: currency,
        phone: reqBody.phone,
        courses: reqBody.courses,
        paymentType: "paypal",
        month: reqBody.month,
      };
      const pay = await studentRepo.createLiveClassData(paymentData);
      const order = await callPayPal(
        "post",
        "/v2/checkout/orders",
        {
          intent: "CAPTURE",
          purchase_units: [
            {
              reference_id: `LiveClass_${pay._id}`,
              custom_id: String(pay._id),
              description: "Live Yoga Classes Payment",
              amount: {
                currency_code: currency,
                value: amount,
              },
            },
          ],
          application_context: {
            brand_name: "Yoga Vidya School",
            shipping_preference: "NO_SHIPPING",
            user_action: "PAY_NOW",
            return_url: getPayPalRedirectUrl("/confirmation"),
            cancel_url: getPayPalRedirectUrl("/proceed-payment"),
          },
        },
        `LiveClass-create-${pay._id}`,
      );

      const approvalUrl = getPayPalApproveUrl(order);
      if (!order.id || !approvalUrl) {
        throw new Error("PayPal approval URL was not returned");
      }

      await paymentRepo.liveCourseUpdateById(pay._id, {
        paymentId: order.id,
      });
      return resolve({
        orderId: order.id,
        payDbId: pay._id,
        approvalUrl,
      });
    } catch (error) {
      return reject(error);
    }
  });
}

async function completePayPalLiveClassesPayment(order, reqBody, req) {
  const capture = getPayPalCapture(order);
  if (!capture || capture.status !== "COMPLETED") {
    throw new Error("PayPal payment was not completed");
  }

  const onlineData = await paymentRepo.liveCourseUpdateById(reqBody.payDbId, {
    paymentId: capture.id,
    paymentStatus: "paid",
  });

  const pass = reqBody.password || helper.genratePass(6);
  await studentRepo.createStudent({
    firstName: onlineData.name,
    email: onlineData.email,
    phoneNumber: onlineData.phone,
    isActive: true,
    password: pass,
    paymentCourseId: constants.COURSE.ONLINE_LIVE_CLASSES,
    course: onlineData.courses,
    source: `onlineSadhana_${onlineData._id}_${onlineData.month}`,
  });

  const { name, email, phone, price, currency, courses } = onlineData;
  const courseList = (courses || []).map((c) => ({ id: c.id }));

  for (let i = 0; i < courseList.length; i++) {
    const mentors = await courseRepo.getCourseBySlug("online-yoga-classes");
    const item = mentors.teachersData.find((obj) => courseList[i].id == obj.id);
    await helper.onlineSadhanaClassSendMail(name, email, item, pass);
  }

  const replacements = {
    name: name,
    phoneNo: phone,
    email: email,
    price: price,
    payId: capture.id,
    currency: currency,
    status: "paid",
    items: courseList,
  };
  await helper.adminOnlineSadhanaClassSendMail(replacements);

  const clientData = req ? extractClientData(req) : {};
  await paymentTrackingService.trackLiveClassPurchase(
    {
      paymentId: capture.id,
      ...clientData,
    },
    {
      email,
      phone,
      name,
      price,
      currency,
    },
  );

  return {
    status: 200,
    data: {
      status: "success",
      paymtId: capture.id,
      amount: Number(capture.amount?.value || onlineData.price || 0),
      currency: capture.amount?.currency_code || onlineData.currency,
    },
  };
}

function getPaypalPaymentResultLiveClasses(reqBody, req = null) {
  return new Promise(async (resolve, reject) => {
    try {
      const payDbId = reqBody.payDbId;
      const paypalOrderId = reqBody.paypalOrderId;
      const paymentDetails = await paymentRepo.getOneFromLiveCourse(payDbId);
      if (!paymentDetails) {
        return resolve({
          status: 404,
          data: { status: "failed", message: "Payment record not found" },
        });
      }
      if (paymentDetails.paymentStatus === "paid") {
        return resolve({
          status: 200,
          data: {
            status: "success",
            paymtId: paymentDetails.paymentId,
            amount: Number(paymentDetails.price || 0),
            currency: paymentDetails.currency,
          },
        });
      }
      if (paymentDetails.paymentId !== paypalOrderId) {
        return resolve({
          status: 400,
          data: { status: "failed", message: "PayPal order mismatch" },
        });
      }

      const order = await getPayPalOrder(paypalOrderId);
      if (order.status === "COMPLETED") {
        const returnData = await completePayPalLiveClassesPayment(
          order,
          reqBody,
          req,
        );
        return resolve(returnData);
      }
      if (order.status !== "APPROVED") {
        return resolve({
          status: 200,
          data: { status: "failed", paypalOrderId },
        });
      }

      const capturedOrder = await capturePayPalOrder(paypalOrderId, payDbId);
      const returnData = await completePayPalLiveClassesPayment(
        capturedOrder,
        reqBody,
        req,
      );
      return resolve(returnData);
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
      const fiveMinutesAhead = new Date(now.getTime() - 1 * 60 * 1000);
      const tenMinutesAhead = new Date(now.getTime() - 10 * 60 * 1000);
      const paymentData =
        await paymentRepo.updateOnlineSadhanaPaymentStatusForcefully(
          tenMinutesAhead.toISOString(),
          fiveMinutesAhead.toISOString(),
        );
      for (const obj of paymentData) {
        if (obj.paymentType == "stripe") {
          const session = await stripe.checkout.sessions.retrieve(
            obj.paymentId,
          );
          if (session.payment_status == "paid") {
            const pass = helper.genratePass(6);
            await studentRepo.createStudent({
              firstName: obj.name,
              email: obj.email,
              phoneNumber: obj.phone,
              isActive: true,
              password: pass,
              paymentCourseId: constants.COURSE.ONLINE_LIVE_CLASSES,
              course: obj.courses,
              source: `onlineSadhana_${obj._id}_${obj.month}`,
            });
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
                },
              );
            } catch (e) {
              console.error(
                "Live Class purchase tracking (Stripe force) failed:",
                e?.message || e,
              );
            }
            for (let coursObj of obj.courses) {
              var item = mentors.teachersData.find(
                (obj) => coursObj.id == obj.id,
              );
              if (item) {
                await helper.onlineSadhanaClassSendMail(
                  obj.name,
                  obj.email,
                  item,
                  pass,
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
                const pass = helper.genratePass(6);
                await studentRepo.createStudent({
                  firstName: obj.name,
                  email: obj.email,
                  phoneNumber: obj.phone,
                  isActive: true,
                  password: pass,
                  paymentCourseId: constants.COURSE.ONLINE_LIVE_CLASSES,
                  course: obj.courses,
                  source: `onlineSadhana_${obj._id}_${obj.month}`,
                });
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
                    },
                  );
                } catch (e) {
                  console.error(
                    "Live Class purchase tracking (Razorpay force) failed:",
                    e?.message || e,
                  );
                }
                for (let coursObj of obj.courses) {
                  var item = mentors.teachersData.find(
                    (obj) => coursObj.id == obj.id,
                  );
                  if (item) {
                    if (item) {
                      await helper.onlineSadhanaClassSendMail(
                        obj.name,
                        obj.email,
                        item,
                        pass,
                      );
                    }
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
          fiveMinutesAhead.toISOString(),
        );
      for (const obj of paymentData) {
        let coursetitle = await courseRepo.getCourseById(course);
        let studentData = await studentRepo.getStudentById(obj.studentId);
        if (obj.paymentBy == "Stripe") {
          const session = await stripe.checkout.sessions.retrieve(
            obj.paymentId,
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
              updatedCourses,
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
                  updatedCourses,
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
function createPranicPurificationIIStudent(user, password) {
  return new Promise(async (resolve, reject) => {
    try {
      let studentData = {
        email: user.email,
        firstName: user.name,
        isActive: true,
        password: password,
        phoneNumber: user.phoneNumber,
        course: [constants.COURSE.PRANIC_PURIFICATION_II],
        source: `${constants.STUDENT_SOURCCE.PRANIC_II}${user._id}_${user.month}`,
        paymentCourseId: constants.COURSE.PRANIC_PURIFICATION_II,
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
          fiveMinutesAhead.toISOString(),
        );
      for (const obj of paymentData) {
        const password = helper.genratePass(6);
        if (obj.paymentType == "stripe") {
          const session = await stripe.checkout.sessions.retrieve(
            obj.paymentId,
          );
          if (session.payment_status == "paid") {
            await paymentRepo.pranicPurificationUpdateById(obj._id, {
              paymentStatus: "paid",
              isPaymentCheck: true,
            });
            createPranicPurificationStudent(obj, password);
            helper.completePranicPurificationAutomationEmail(obj, password);
            paymentTrackingService.trackPranicPurificationPurchase(
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
              },
            );
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
                paymentTrackingService.trackPranicPurificationPurchase(
                  {
                    paymentId: obj.paymentId,
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
                  },
                );
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
function updatePranicPurificationIIStatusForcefully() {
  return new Promise(async (resolve, reject) => {
    try {
      const now = new Date();
      const fiveMinutesAhead = new Date(now.getTime() - 1 * 60 * 1000);
      const tenMinutesAhead = new Date(now.getTime() - 30 * 60 * 1000);
      const paymentData =
        await paymentRepo.updatePranicPurificationIIStatusForcefully(
          tenMinutesAhead.toISOString(),
          fiveMinutesAhead.toISOString(),
        );
      for (const obj of paymentData) {
        const password = helper.genratePass(6);
        if (obj.paymentType == "stripe") {
          const session = await stripe.checkout.sessions.retrieve(
            obj.paymentId,
          );
          if (session.payment_status == "paid") {
            await paymentRepo.pranicPurificationIIUpdateById(obj._id, {
              paymentStatus: "paid",
              isPaymentCheck: true,
            });
            createPranicPurificationIIStudent(obj, password);
            helper.completePranicPurificationIIAutomationEmail(obj, password);
            paymentTrackingService.trackPranicPurificationIIPurchase(
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
              },
            );
          } else {
            await paymentRepo.pranicPurificationIIUpdateById(obj._id, {
              isPaymentCheck: true,
            });
            await helper.completePranicPurificationIIEmail(obj);
          }
        } else {
          const payments = await razorpay.orders.fetchPayments(obj.paymentId);
          if (payments.items && payments.items.length > 0) {
            const payment = payments.items.find((p) => p.status == "captured");
            if (payment.status === "captured") {
              const generatedSignature = crypto
                .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
                .update(obj.paymentId + "|" + payment.id)
                .digest("hex");
              if (
                generatedSignature === payment.signature ||
                !payment.signature
              ) {
                await paymentRepo.pranicPurificationIIUpdateById(obj._id, {
                  paymentStatus: "paid",
                  isPaymentCheck: true,
                });
                createPranicPurificationIIStudent(obj, password);
                helper.completePranicPurificationIIAutomationEmail(
                  obj,
                  password,
                );
                paymentTrackingService.trackPranicPurificationIIPurchase(
                  {
                    paymentId: obj.paymentId,
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
                  },
                );
              }
            }
          } else {
            await paymentRepo.pranicPurificationIIUpdateById(obj._id, {
              isPaymentCheck: true,
            });
            await helper.completePranicPurificationIIEmail(obj);
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
        fiveMinutesAhead.toISOString(),
      );
      for (const obj of paymentData) {
        if (obj.paymentType == "stripe") {
          const session = await stripe.checkout.sessions.retrieve(
            obj.paymentId,
          );
          if (session.payment_status == "paid") {
            await paymentRepo.rishikeshUpdateById(obj._id, {
              paymentStatus: "paid",
              isPaymentCheck: true,
            });
            helper.sendRishikeshCourseEmail(obj);
            paymentTrackingService.trackRishikeshPurchase(
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
              },
            );
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
                paymentTrackingService.trackRishikeshPurchase(
                  {
                    paymentId: obj.paymentId,
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
                  },
                );
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
        reqBody.sessionId,
      );
      if (session.payment_status == "paid") {
        const user = await paymentRepo.updateBaliStudentData(
          reqBody.payDbId,
          session.payment_intent,
          true,
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

// ─── Bali PayPal ──────────────────────────────────────────────────────

function checkoutPaypalForBali(reqBody) {
  return new Promise(async (resolve, reject) => {
    try {
      const currency = PAYPAL_CURRENCY;
      const amount = formatPayPalAmount(reqBody.price);
      reqBody.paymentType = "paypal";
      reqBody.currency = currency;
      reqBody.price = amount;

      let pay = await paymentRepo.createBaliData(reqBody);

      const hourLabel = reqBody.hour ? `${reqBody.hour} Hours` : "Bali";
      const courseDescription = `${hourLabel} Yoga Teacher Training in Bali Payment`;
      const cancelSlug =
        reqBody.hour === 100
          ? "/checkout/100-hour-yoga-teacher-training-in-bali"
          : reqBody.hour === 300
            ? "/checkout/300-hour-yoga-teacher-training-in-bali"
            : "/checkout/200-hour-yoga-teacher-training-in-bali";

      const order = await callPayPal(
        "post",
        "/v2/checkout/orders",
        {
          intent: "CAPTURE",
          purchase_units: [
            {
              reference_id: `Bali_${pay._id}`,
              custom_id: String(pay._id),
              description: courseDescription,
              amount: {
                currency_code: currency,
                value: amount,
              },
            },
          ],
          application_context: {
            brand_name: "Yoga Vidya School",
            shipping_preference: "NO_SHIPPING",
            user_action: "PAY_NOW",
            return_url: getPayPalRedirectUrl("/confirmation"),
            cancel_url: getPayPalRedirectUrl(cancelSlug),
          },
        },
        `Bali-create-${pay._id}`,
      );

      const approvalUrl = getPayPalApproveUrl(order);
      if (!order.id || !approvalUrl) {
        throw new Error("PayPal approval URL was not returned");
      }

      await paymentRepo.baliUpdateById(pay._id, { paymentId: order.id });
      return resolve({
        orderId: order.id,
        payDbId: pay._id,
        approvalUrl,
      });
    } catch (error) {
      return reject(error);
    }
  });
}

async function completePayPalBaliPayment(order, reqBody, req) {
  const capture = getPayPalCapture(order);
  if (!capture || capture.status !== "COMPLETED") {
    throw new Error("PayPal payment was not completed");
  }

  const user = await paymentRepo.updateBaliStudentData(
    reqBody.payDbId,
    capture.id,
    true,
  );
  await helper.sendBaliCourseEmail(user);
  const clientData = req ? extractClientData(req) : {};
  paymentTrackingService.trackBaliPurchase
    ? paymentTrackingService.trackBaliPurchase(
        { paymentId: capture.id, ...clientData },
        user,
      )
    : null;

  return {
    status: 200,
    data: {
      status: "success",
      paymtId: capture.id,
      amount: Number(capture.amount?.value || user.price || 0),
      currency: capture.amount?.currency_code || user.currency,
    },
  };
}

function getPaypalPaymentResultBali(reqBody, req = null) {
  return new Promise(async (resolve, reject) => {
    try {
      const payDbId = reqBody.payDbId;
      const paypalOrderId = reqBody.paypalOrderId;
      const paymentDetails =
        await paymentRepo.getBaliPaymentDetailsById(payDbId);
      if (!paymentDetails) {
        return resolve({
          status: 404,
          data: { status: "failed", message: "Payment record not found" },
        });
      }
      if (paymentDetails.paymentStatus === "paid") {
        return resolve({
          status: 200,
          data: {
            status: "success",
            paymtId: paymentDetails.paymentId,
            amount: Number(paymentDetails.price || 0),
            currency: paymentDetails.currency,
          },
        });
      }
      if (paymentDetails.paymentId !== paypalOrderId) {
        return resolve({
          status: 400,
          data: { status: "failed", message: "PayPal order mismatch" },
        });
      }

      const order = await getPayPalOrder(paypalOrderId);
      if (order.status === "COMPLETED") {
        const returnData = await completePayPalBaliPayment(order, reqBody, req);
        return resolve(returnData);
      }
      if (order.status !== "APPROVED") {
        return resolve({
          status: 200,
          data: { status: "failed", paypalOrderId },
        });
      }

      const capturedOrder = await capturePayPalOrder(paypalOrderId, payDbId);
      const returnData = await completePayPalBaliPayment(
        capturedOrder,
        reqBody,
        req,
      );
      return resolve(returnData);
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
        fiveMinutesAhead.toISOString(),
      );
      for (const obj of paymentData) {
        if (obj.paymentType == "stripe") {
          const session = await stripe.checkout.sessions.retrieve(
            obj.paymentId,
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
      }
      resolve(1);
    } catch (error) {
      return reject(error);
    }
  });
}
function verifyRazorpayPaymentOnlineSadhana({
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
  payDbId,
  clientIpReq,
  userAgentReq,
  reqBody,
}) {
  return new Promise(async (resolve, reject) => {
    try {
      const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
      hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
      const generatedSignature = hmac.digest("hex");
      if (generatedSignature !== razorpay_signature) {
        return resolve({ status: "failed", reason: "Signature mismatch" });
      }
      const val = {
        paymentStatus: "paid",
        payDbId: payDbId,
        paymentId: razorpay_payment_id,
      };
      const onlineData = await paymentRepo.liveCourseUpdateById(val.payDbId, {
        paymentId: val.paymentId,
        paymentStatus: val.paymentStatus,
      });
      await studentRepo.createStudent({
        firstName: onlineData.name,
        email: onlineData.email,
        phoneNumber: onlineData.phone,
        isActive: true,
        password: reqBody.password,
        paymentCourseId: constants.COURSE.ONLINE_LIVE_CLASSES,
        course: onlineData.courses,
        source: `onlineSadhana_${onlineData._id}_${onlineData.month}`,
      });
      const customer = await paymentRepo.getOneFromLiveCourse(val.payDbId);
      const {
        name,
        email,
        phone,
        currency,
        price,
        courses,
        paymentStatus,
        paymentId,
      } = customer;
      const courseList = courses.map((course) => ({
        id: course.id,
      }));
      const clientIp = clientIpReq;
      const userAgent = userAgentReq;
      for (var i = 0; i < courseList.length; i++) {
        const mentors = await courseRepo.getCourseBySlug("online-yoga-classes");
        var item = mentors.teachersData.find(
          (obj) => courseList[i].id == obj.id,
        );
        await helper.onlineSadhanaClassSendMail(
          name,
          email,
          item,
          reqBody.password,
        );
      }
      const replacements = {
        name: name,
        phoneNo: phone,
        email: email,
        price: price,
        payId: paymentId,
        currency: currency,
        status: paymentStatus,
        items: courseList,
      };
      await helper.adminOnlineSadhanaClassSendMail(replacements);
      await paymentTrackingService.trackLiveClassPurchase(
        {
          paymentId: val.paymentId,
          clientIp,
          userAgent,
          fbc: reqBody?.fbc || "",
          fbp: reqBody?.fbq || "",
        },
        {
          email,
          phone,
          name,
          price,
          currency,
        },
      );
      return resolve({ status: "success", paymentId, amount: price, currency });
    } catch (error) {
      return reject(error);
    }
  });
}
function verifyStripePaymentOnlineSadhana(reqBody, clientIpReq, userAgentReq) {
  return new Promise(async (resolve, reject) => {
    try {
      const session = await stripe.checkout.sessions.retrieve(
        reqBody.sessionId,
      );
      if (session.payment_status == "paid") {
        let val = {
          paymentStatus: "paid",
          payDbId: reqBody.dbPay,
          paymentId: session.payment_intent,
        };
        const onlineData = await paymentRepo.liveCourseUpdateById(val.payDbId, {
          paymentId: val.paymentId,
          paymentStatus: val.paymentStatus,
        });
        await studentRepo.createStudent({
          firstName: onlineData.name,
          email: onlineData.email,
          phoneNumber: onlineData.phone,
          isActive: true,
          password: reqBody.password,
          paymentCourseId: constants.COURSE.ONLINE_LIVE_CLASSES,
          course: onlineData.courses,
          source: `onlineSadhana_${onlineData._id}_${onlineData.month}`,
        });
        var { name, email, phone, price, currency, courses } = onlineData;
        const courseList = courses.reduce((acc, course) => {
          acc.push({
            id: course.id,
          });
          return acc;
        }, []);
        for (var i = 0; i < courseList.length; i++) {
          const mentors = await courseRepo.getCourseBySlug(
            "online-yoga-classes",
          );
          var item = mentors.teachersData.find(
            (obj) => courseList[i].id == obj.id,
          );
          await helper.onlineSadhanaClassSendMail(
            name,
            email,
            item,
            reqBody.password,
          );
        }
        const replacements = {
          name: name,
          phoneNo: phone,
          email: email,
          price: price,
          payId: val.paymentId,
          currency: currency,
          status: val.paymentStatus,
          items: courseList,
        };
        await helper.adminOnlineSadhanaClassSendMail(replacements);
        await paymentTrackingService.trackLiveClassPurchase(
          {
            paymentId: val.paymentId || session.payment_intent,
            clientIp: clientIpReq,
            userAgent: userAgentReq,
            fbc: reqBody?.fbc || "",
            fbp: reqBody?.fbq || "",
          },
          {
            email,
            phone,
            name,
            price,
            currency,
          },
        );
        return resolve({
          status: "success",
          sessionId: reqBody.sessionId,
          paymtId: session.payment_intent,
          amount: session.amount_total / 100,
          currency: session.currency,
        });
      }
    } catch (error) {
      return reject(error);
    }
  });
}
function checkoutRazorpayForPranayamaCertification(reqBody) {
  return new Promise(async (resolve, reject) => {
    try {
      let pay;
      if (reqBody.id) {
        let data =
          await paymentRepo.getPranayamaCertificationPaymentDetailsById(
            reqBody.id,
          );
        await paymentRepo.updatePranayamaCertificationPayment(
          { price: +data.price + reqBody.price, dueAmount: 0 },
          reqBody.id,
        );
        pay = await paymentRepo.getPranayamaCertificationPaymentDetailsById(
          reqBody.id,
        );
      } else {
        let userData = {
          name: reqBody.name,
          email: reqBody.email,
          phoneNumber: reqBody.phoneNumber,
          currency: reqBody.currency,
          price: reqBody.price,
          paymentType: "razorpay",
          dueAmount: reqBody.dueAmount || 0,
          month: reqBody.month || "February, 2027",
        };
        pay = await paymentRepo.createPranayamaCertificationData(userData);
      }
      const amountInSubunits = reqBody.price * 100;
      const options = {
        amount: amountInSubunits,
        currency: reqBody.currency,
        receipt: `PranCert_${pay._id}`,
        payment_capture: 1,
      };
      const order = await razorpay.orders.create(options);
      await paymentRepo.updatePranayamaCertificationPayment(
        { paymentId: order.id },
        pay._id,
      );
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
function getRazorPaymentResultPranayamaCertification(reqBody, req = null) {
  return new Promise(async (resolve, reject) => {
    try {
      const hmac = crypto.createHmac("sha256", razorpay.key_secret);
      hmac.update(reqBody.razorpayOrderId + "|" + reqBody.razorpayPaymentId);
      const generatedSignature = hmac.digest("hex");
      if (generatedSignature === reqBody.razorpaySignature) {
        const user = await paymentRepo.updatePranayamaCertificationData(
          reqBody.payDbId,
          reqBody.razorpayPaymentId,
          true,
        );
        await savePranaArambhOnPranayamaCertification(user, reqBody);
        await helper.sendPranayamaCertificationEmail(user, reqBody.password);
        return resolve({
          amount: +user.price,
          currency: user.currency,
        });
      } else {
        await paymentRepo.updatePranayamaCertificationData(
          reqBody.payDbId,
          null,
          false,
        );
        return reject("Payment verification failed");
      }
    } catch (error) {
      return reject(error);
    }
  });
}
function checkoutStripeForPranayamaCertification(reqBody) {
  return new Promise(async (resolve, reject) => {
    try {
      let pay;
      if (reqBody.id) {
        let data =
          await paymentRepo.getPranayamaCertificationPaymentDetailsById(
            reqBody.id,
          );
        await paymentRepo.updatePranayamaCertificationPayment(
          { price: +data.price + reqBody.price, dueAmount: 0 },
          reqBody.id,
        );
        pay = await paymentRepo.getPranayamaCertificationPaymentDetailsById(
          reqBody.id,
        );
      } else {
        let userData = {
          name: reqBody.name,
          email: reqBody.email,
          phoneNumber: reqBody.phoneNumber,
          currency: reqBody.currency,
          price: reqBody.price,
          paymentType: "stripe",
          dueAmount: reqBody.dueAmount || 0,
          month: reqBody.month || "February, 2027",
        };
        pay = await paymentRepo.createPranayamaCertificationData(userData);
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
      await paymentRepo.updatePranayamaCertificationPayment(
        { paymentId: session.id },
        pay._id,
      );
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
function getStripePaymentResultPranayamaCertification(reqBody, req = null) {
  return new Promise(async (resolve, reject) => {
    try {
      const session = await stripe.checkout.sessions.retrieve(
        reqBody.sessionId,
      );
      if (session.payment_status == "paid") {
        const user = await paymentRepo.updatePranayamaCertificationData(
          reqBody.payDbId,
          session.payment_intent,
          true,
        );
        await savePranaArambhOnPranayamaCertification(user, reqBody);
        await helper.sendPranayamaCertificationEmail(user, reqBody.password);
        return resolve({
          status: "success",
          sessionId: reqBody.sessionId,
          paymtId: session.payment_intent,
          amount: session.amount_total / 100,
          currency: session.currency,
        });
      } else {
        await paymentRepo.updatePranayamaCertificationData(
          reqBody.payDbId,
          null,
          false,
        );
        return resolve({
          status: "failed",
          sessionId: reqBody.sessionId,
        });
      }
    } catch (error) {
      return reject(error);
    }
  });
}
function savePranaArambhOnPranayamaCertification(user, reqBody) {
  return new Promise(async (resolve, reject) => {
    try {
      let studentData = {
        email: user.email,
        firstName: user.name,
        isActive: true,
        password: reqBody.password,
        course: [constants.COURSE.PRANAYAMA_CERTIFICATION],
        source: `PranayamaCertification_${user._id}_${user.month || "February, 2027"}`,
        paymentCourseId: constants.COURSE.PRANAYAMA_CERTIFICATION,
      };
      if (user.phoneNumber && user.phoneNumber !== "N/A") {
        studentData.phoneNumber = user.phoneNumber;
      }
      await studentRepo.createStudent(studentData);
      return resolve(1);
    } catch (error) {
      return reject(error);
    }
  });
}
function checkoutRazorpayRetreat(reqBody) {
  return new Promise(async (resolve, reject) => {
    try {
      reqBody.paymentType = "razorpay";
      let pay = await paymentRepo.createRetreatData(reqBody);
      const amountInSubunits = reqBody.price * 100;
      const options = {
        amount: amountInSubunits,
        currency: reqBody.currency,
        receipt: `retreat_mysore_${pay._id}`,
        payment_capture: 1,
      };
      const order = await razorpay.orders.create(options);
      await paymentRepo.retreatUpdateById(pay._id, {
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
function getRazorPaymentResultRetreat(reqBody, req = null) {
  return new Promise(async (resolve, reject) => {
    try {
      const hmac = crypto.createHmac("sha256", razorpay.key_secret);
      hmac.update(reqBody.razorpayOrderId + "|" + reqBody.razorpayPaymentId);
      const generatedSignature = hmac.digest("hex");
      if (generatedSignature === reqBody.razorpaySignature) {
        const user = await paymentRepo.updateRetreatePaymentStatusData(
          reqBody.payDbId,
          reqBody.razorpayPaymentId,
          true,
        );
        await helper.sendRetreatPaymentEmail(user);
        const clientData = req ? extractClientData(req) : {};
        paymentTrackingService.trackRetreatPurchase(
          {
            paymentId: reqBody.razorpayPaymentId,
            ...clientData,
          },
          user,
        );
        return resolve({
          amount: +user.price,
          currency: user.currency,
        });
      } else {
        await paymentRepo.updateRetreatePaymentStatusData(
          reqBody.payDbId,
          null,
          false,
        );
        return reject("Payment verification failed");
      }
    } catch (error) {
      return reject(error);
    }
  });
}
function checkoutStripeForRetreat(reqBody) {
  return new Promise(async (resolve, reject) => {
    try {
      reqBody.paymentType = "stripe";
      let pay = await paymentRepo.createRetreatData(reqBody);
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
      await paymentRepo.retreatUpdateById(pay._id, {
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
function getStripePaymentResultRetreat(reqBody, req = null) {
  return new Promise(async (resolve, reject) => {
    try {
      const session = await stripe.checkout.sessions.retrieve(
        reqBody.sessionId,
      );
      if (session.payment_status == "paid") {
        const user = await paymentRepo.updateRetreatePaymentStatusData(
          reqBody.payDbId,
          session.payment_intent,
          true,
        );
        await helper.sendRetreatPaymentEmail(user);
        const clientData = req ? extractClientData(req) : {};
        paymentTrackingService.trackRetreatPurchase(
          {
            paymentId: session.payment_intent,
            ...clientData,
          },
          user,
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
        await paymentRepo.updateRetreatePaymentStatusData(
          reqBody.payDbId,
          null,
          false,
        );
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
function checkoutPaypalForRetreat(reqBody) {
  return new Promise(async (resolve, reject) => {
    try {
      const currency = PAYPAL_CURRENCY;
      const amount = formatPayPalAmount(reqBody.price);
      reqBody.paymentType = "paypal";
      reqBody.currency = currency;
      reqBody.price = amount;

      let pay = await paymentRepo.createRetreatData(reqBody);

      const order = await callPayPal(
        "post",
        "/v2/checkout/orders",
        {
          intent: "CAPTURE",
          purchase_units: [
            {
              reference_id: `Retreat_${pay._id}`,
              custom_id: String(pay._id),
              description: "The Essence of Yoga – Mysore Retreat Payment",
              amount: {
                currency_code: currency,
                value: amount,
              },
            },
          ],
          application_context: {
            brand_name: "Yoga Vidya School",
            shipping_preference: "NO_SHIPPING",
            user_action: "PAY_NOW",
            return_url: getPayPalRedirectUrl("/confirmation"),
            cancel_url: getPayPalRedirectUrl("/checkout/mysore-retreat"),
          },
        },
        `Retreat-create-${pay._id}`,
      );

      const approvalUrl = getPayPalApproveUrl(order);
      if (!order.id || !approvalUrl) {
        throw new Error("PayPal approval URL was not returned");
      }

      await paymentRepo.retreatUpdateById(pay._id, { paymentId: order.id });
      return resolve({
        orderId: order.id,
        payDbId: pay._id,
        approvalUrl,
      });
    } catch (error) {
      return reject(error);
    }
  });
}
async function completePayPalRetreatPayment(order, reqBody, req) {
  const capture = getPayPalCapture(order);
  if (!capture || capture.status !== "COMPLETED") {
    throw new Error("PayPal payment was not completed");
  }

  const user = await paymentRepo.updateRetreatePaymentStatusData(
    reqBody.payDbId,
    capture.id,
    true,
  );
  await helper.sendRetreatPaymentEmail(user);
  const clientData = req ? extractClientData(req) : {};
  paymentTrackingService.trackRetreatPurchase(
    {
      paymentId: capture.id,
      ...clientData,
    },
    user,
  );

  return {
    status: 200,
    data: {
      status: "success",
      paymtId: capture.id,
      amount: Number(capture.amount?.value || user.price || 0),
      currency: capture.amount?.currency_code || user.currency,
    },
  };
}
function getPaypalPaymentResultRetreat(reqBody, req = null) {
  return new Promise(async (resolve, reject) => {
    try {
      const payDbId = reqBody.payDbId;
      const paypalOrderId = reqBody.paypalOrderId;
      const paymentDetails =
        await paymentRepo.getRetreatPaymentDetailsById(payDbId);
      if (!paymentDetails) {
        return resolve({
          status: 404,
          data: { status: "failed", message: "Payment record not found" },
        });
      }
      if (paymentDetails.paymentStatus === "paid") {
        return resolve({
          status: 200,
          data: {
            status: "success",
            paymtId: paymentDetails.paymentId,
            amount: Number(paymentDetails.price || 0),
            currency: paymentDetails.currency,
          },
        });
      }
      if (paymentDetails.paymentId !== paypalOrderId) {
        return resolve({
          status: 400,
          data: { status: "failed", message: "PayPal order mismatch" },
        });
      }

      const order = await getPayPalOrder(paypalOrderId);
      if (order.status === "COMPLETED") {
        const returnData = await completePayPalRetreatPayment(
          order,
          reqBody,
          req,
        );
        return resolve(returnData);
      }
      if (order.status !== "APPROVED") {
        return resolve({
          status: 200,
          data: { status: "failed", paypalOrderId },
        });
      }

      const capturedOrder = await capturePayPalOrder(paypalOrderId, payDbId);
      const returnData = await completePayPalRetreatPayment(
        capturedOrder,
        reqBody,
        req,
      );
      return resolve(returnData);
    } catch (error) {
      return reject(error);
    }
  });
}
// ─── Rishikesh PayPal ──────────────────────────────────────────────────
function checkoutPaypalForRishikesh(reqBody) {
  return new Promise(async (resolve, reject) => {
    try {
      const currency = PAYPAL_CURRENCY;
      const amount = formatPayPalAmount(reqBody.price);
      reqBody.paymentType = "paypal";
      reqBody.currency = currency;
      reqBody.price = amount;

      let pay = await paymentRepo.createRishikeshData(reqBody);

      const hourLabel = reqBody.hour ? `${reqBody.hour} Hours` : "Rishikesh";
      const courseDescription = `${hourLabel} Yoga Teacher Training in Rishikesh Payment`;
      const cancelSlug =
        reqBody.hour === 100
          ? "/checkout/100-hours-yoga-teacher-training-in-rishikesh"
          : reqBody.hour === 300
            ? "/checkout/300-hours-yoga-teacher-training-in-rishikesh"
            : "/checkout/200-hours-yoga-teacher-training-in-rishikesh";

      const order = await callPayPal(
        "post",
        "/v2/checkout/orders",
        {
          intent: "CAPTURE",
          purchase_units: [
            {
              reference_id: `Rishikesh_${pay._id}`,
              custom_id: String(pay._id),
              description: courseDescription,
              amount: {
                currency_code: currency,
                value: amount,
              },
            },
          ],
          application_context: {
            brand_name: "Yoga Vidya School",
            shipping_preference: "NO_SHIPPING",
            user_action: "PAY_NOW",
            return_url: getPayPalRedirectUrl("/confirmation"),
            cancel_url: getPayPalRedirectUrl(cancelSlug),
          },
        },
        `Rishikesh-create-${pay._id}`,
      );

      const approvalUrl = getPayPalApproveUrl(order);
      if (!order.id || !approvalUrl) {
        throw new Error("PayPal approval URL was not returned");
      }

      await paymentRepo.rishikeshUpdateById(pay._id, { paymentId: order.id });
      return resolve({
        orderId: order.id,
        payDbId: pay._id,
        approvalUrl,
      });
    } catch (error) {
      return reject(error);
    }
  });
}
async function completePayPalRishikeshPayment(order, reqBody, req) {
  const capture = getPayPalCapture(order);
  if (!capture || capture.status !== "COMPLETED") {
    throw new Error("PayPal payment was not completed");
  }

  const user = await paymentRepo.updateRishikeshStudentData(
    reqBody.payDbId,
    capture.id,
    true,
  );
  await helper.sendRishikeshCourseEmail(user);
  const clientData = req ? extractClientData(req) : {};
  paymentTrackingService.trackRishikeshPurchase(
    {
      paymentId: capture.id,
      ...clientData,
    },
    user,
  );

  return {
    status: 200,
    data: {
      status: "success",
      paymtId: capture.id,
      amount: Number(capture.amount?.value || user.price || 0),
      currency: capture.amount?.currency_code || user.currency,
    },
  };
}
function getPaypalPaymentResultRishikesh(reqBody, req = null) {
  return new Promise(async (resolve, reject) => {
    try {
      const payDbId = reqBody.payDbId;
      const paypalOrderId = reqBody.paypalOrderId;
      const paymentDetails =
        await paymentRepo.getRishikeshPaymentDetailsById(payDbId);
      if (!paymentDetails) {
        return resolve({
          status: 404,
          data: { status: "failed", message: "Payment record not found" },
        });
      }
      if (paymentDetails.paymentStatus === "paid") {
        return resolve({
          status: 200,
          data: {
            status: "success",
            paymtId: paymentDetails.paymentId,
            amount: Number(paymentDetails.price || 0),
            currency: paymentDetails.currency,
          },
        });
      }
      if (paymentDetails.paymentId !== paypalOrderId) {
        return resolve({
          status: 400,
          data: { status: "failed", message: "PayPal order mismatch" },
        });
      }

      const order = await getPayPalOrder(paypalOrderId);
      if (order.status === "COMPLETED") {
        const returnData = await completePayPalRishikeshPayment(
          order,
          reqBody,
          req,
        );
        return resolve(returnData);
      }
      if (order.status !== "APPROVED") {
        return resolve({
          status: 200,
          data: { status: "failed", paypalOrderId },
        });
      }

      const capturedOrder = await capturePayPalOrder(paypalOrderId, payDbId);
      const returnData = await completePayPalRishikeshPayment(
        capturedOrder,
        reqBody,
        req,
      );
      return resolve(returnData);
    } catch (error) {
      return reject(error);
    }
  });
}
function updateRetreatStatusForcefully() {
  return new Promise(async (resolve, reject) => {
    try {
      const now = new Date();
      const fiveMinutesAhead = new Date(now.getTime() - 1 * 60 * 1000);
      const tenMinutesAhead = new Date(now.getTime() - 10 * 60 * 1000);
      const paymentData = await paymentRepo.updateRetreatStatusForcefully(
        tenMinutesAhead.toISOString(),
        fiveMinutesAhead.toISOString(),
      );
      for (const obj of paymentData) {
        if (obj.paymentType == "stripe") {
          const session = await stripe.checkout.sessions.retrieve(
            obj.paymentId,
          );
          if (session.payment_status == "paid") {
            await paymentRepo.retreatUpdateById(obj._id, {
              paymentStatus: "paid",
              isPaymentCheck: true,
            });
            helper.sendRetreatPaymentEmail(obj);
          } else {
            await paymentRepo.retreatUpdateById(obj._id, {
              isPaymentCheck: true,
            });
            await helper.completeRetreatPaymentEmail(obj.name, obj.email);
          }
        } else {
          const payments = await razorpay.orders.fetchPayments(obj.paymentId);
          if (payments.items && payments.items.length > 0) {
            const payment = payments.items.find((p) => p.status == "captured");
            if (payment.status === "captured") {
              const generatedSignature = crypto
                .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
                .update(obj.paymentId + "|" + payment.id)
                .digest("hex");
              if (
                generatedSignature === payment.signature ||
                !payment.signature
              ) {
                await paymentRepo.retreatUpdateById(obj._id, {
                  paymentStatus: "paid",
                  isPaymentCheck: true,
                });
                await helper.sendRetreatPaymentEmail(obj);
              }
            }
          } else {
            await paymentRepo.retreatUpdateById(obj._id, {
              isPaymentCheck: true,
            });
            await helper.completeRetreatPaymentEmail(obj.name, obj.email);
          }
        }
      }
      resolve(1);
    } catch (error) {
      return reject(error);
    }
  });
}
function checkoutRazorpayPg(reqBody) {
  return new Promise(async (resolve, reject) => {
    try {
      const selectedDate = new Date(reqBody.selectedDate);
      let todayDate = new Date();
      todayDate = new Date(
        todayDate.getFullYear(),
        todayDate.getMonth(),
        todayDate.getDate(),
      );
      if (selectedDate >= todayDate) {
        reqBody.paymentType = "razorpay";
        let pay = await paymentRepo.createPgData(reqBody);
        const amountInSubunits = reqBody.price * 100;
        const options = {
          amount: amountInSubunits,
          currency: reqBody.currency,
          receipt: `pg_${pay._id}`,
          payment_capture: 1,
        };
        const order = await razorpay.orders.create(options);
        await paymentRepo.retreatUpdateById(pay._id, {
          paymentId: order.id,
        });
        return resolve({
          orderId: order.id,
          razorpayKey: process.env.RAZORPAY_KEY_ID,
          payDbId: pay._id,
          amount: amountInSubunits,
        });
      } else {
        return reject({
          message: "Date is not correct",
        });
      }
    } catch (error) {
      return reject(error);
    }
  });
}

module.exports = {
  updateabc,
  checkoutRazorpayForPranicPurification,
  checkoutRazorpayForPranicPurificationII,
  getRazorPaymentResultPranicPurification,
  getRazorPaymentResultPranicPurificationII,
  checkoutStripeForPranicPurification,
  checkoutStripeForPranicPurificationII,
  getCouponCode,
  getRazorpayPaymentResultForPranarambha,
  getPaymentResultPranicPurification,
  getPaymentResultPranicPurificationII,
  disableCouponCode,
  checkoutRazorpayFor200TTC,
  getRazorPaymentResult200TTC,
  checkoutStripeFor200TTC,
  checkoutPaypalFor200TTC,
  getPaypalPaymentResult200TTC,
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
  verifyRazorpayPaymentOnlineSadhana,
  verifyStripePaymentOnlineSadhana,
  savePranaArambhOn200TTC,
  createPranicPurificationIIStudent,
  updatePranicPurificationIIStatusForcefully,
  checkoutRazorpayForPranayamaCertification,
  getRazorPaymentResultPranayamaCertification,
  checkoutStripeForPranayamaCertification,
  getStripePaymentResultPranayamaCertification,
  savePranaArambhOnPranayamaCertification,
  checkoutRazorpayRetreat,
  getRazorPaymentResultRetreat,
  checkoutStripeForRetreat,
  getStripePaymentResultRetreat,
  checkoutPaypalForRetreat,
  getPaypalPaymentResultRetreat,
  updateRetreatStatusForcefully,
  checkoutPaypalForRishikesh,
  getPaypalPaymentResultRishikesh,
  checkoutPaypalForBali,
  getPaypalPaymentResultBali,
  checkoutPaypalForLiveClasses,
  getPaypalPaymentResultLiveClasses,
  checkoutRazorpayPg,
};
