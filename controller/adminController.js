// const User = require('../models/UserModel');
const mentorModel = require("../models/mentorModel");
const sliderModel = require("../models/sliderModel");
const categoryModel = require("../models/categoryModel");
const inquiryModel = require("../models/inquiryModel");
const courseModel = require("../models/courseModel");
const blogModel = require("../models/blogModel");
const mediaModel = require("../models/mediaModel");
const pageModel = require("../models/PagesModel");
const testimonialModel = require("../models/testimonialModel");
const subcategoryModel = require("../models/subcategoryModel");
const subcoursecategoryModel = require("../models/subcatcourseModel");
const categoryTreeModel = require("../models/categoryTreeModel");
const eventModel = require("../models/eventModel");
const adminModel = require("../models/adminModel");
const studentModel = require("../models/StudentModel");
const feedbackModel = require("../models/feedbackModel");
const accesslogModel = require("../models/accesslogModel");
const paymentModel = require("../models/paymentModel");
const onlinepaymentModel = require("../models/onlinePaymentModel");
const onlineVideoModel = require("../models/onlineVideoModel");
const analyticsModel = require("../models/analyticsModel");
const pranicPurificationUsersModel = require("../models/pranicPurificationUsersModel");
const subscribeModel = require("../models/subscribeModel");
const webinarUser = require("../models/webinarRegiserUserModel");
const fs = require("fs");
const path = require("path");
const handlebars = require("handlebars");
const { transporter, createContent } = require("../helpers/nodemail");
const { getTimeBefore } = require("../helpers/helper");
const mongoose = require("mongoose");
const XLSX = require("xlsx");
const Razorpay = require("razorpay");
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});
const helper = require("../helpers/helper");
const constants = require("../helpers/constants.json");
const paymentRepo = require("../repositories/paymentRepository");
const crypto = require("crypto");
const timeSlots = require("../models/TimeSlots");
const liveCoursesCustomermodel = require("../models/liveCoursesCustomerModel");
const jwt = require("jsonwebtoken");
const whatsappCloudApiUrl =
  "https://graph.facebook.com/v22.0/663204330205335/messages";
const axios = require("axios");
const whatsappAccessToken =
  "EAAJpIEWgcakBOwmKbIapeBHzNZCOGcSJzQYQxxr0WknDOAHMbr79BxZAZBZA8ZC5yu0viYXbz4DSFblR9JgSZBEcIe34EeIZABZCK5yfZAzT2yWUaawh8KYDylbI0G8FgZBzL8pCbcQRowddPTZC3EIFPRpaGSH0jf9x0FQM50uvZAyRMLECPElEXKaTv9RdSr0hA8TPOQZDZD";
const stripe = require("stripe")(process.env.STRIP_KEY);
const paymentService = require("../services/paymentService");
const adminService = require("../services/adminService");
const courseService = require("../services/courseService");
const courseRepo = require("../repositories/courseRepository");
const paymentTrackingService = require("../services/paymentTrackingService");
const subscriberService = require("../services/subscriberService");

const mentors = [
  {
    topic: "August 2025 : Yoga Sadhana With Prashant ji",
    time: "Aug 4, 2025 06:00 AM India",
    zoomLink: "https://bit.ly/47r6ukp",
    meetingId: "84583124355",
    passcode: "459027",
    whatsappLink: "https://bit.ly/4qgdsjv",
    name: "Yoga Sadhana",
    subject: "Welcome to Your Online Sadhana with Prashantji",
    emailTemplate: "OrderConfirmationForLiveClassesPrashant.html",
  },
  {
    topic: "August 2025: Women Wellness With Taniya ji",
    time: "Aug 4, 2025 05:00 PM India",
    zoomLink:
      "https://us02web.zoom.us/j/83173733973?pwd=mJK2taSMsVEekm7DTVarH6JWrxRzRo.1",
    meetingId: "831 7373 3973",
    passcode: "928629",
    whatsappLink: "https://chat.whatsapp.com/DEsqbOSf8OiG2V7RYs03Dn",
    name: "Woman Wellness Yoga",
    subject: "Welcome to Your Online Woman Wellness Yoga with Tanya",
    emailTemplate: "OrderConfirmationForLiveClassesTaniya.html",
  },
  {
    topic: "August 2025: HathaYoga With Anuj ji",
    time: "Aug 4, 2025 05:30 AM India",
    zoomLink: "https://bit.ly/Zoom-Hatha-Anuji-S",
    meetingId: "816 3940 0371",
    passcode: "314083",
    whatsappLink: "https://bit.ly/Hatha_Anuji_S",
    name: "Therapeutic Hatha Yoga",
    subject: "Welcome to Your Online Hatha Yoga Classes with Anuji",
    emailTemplate: "OrderConfirmationForLiveClassesHathaAnuj.html",
  },
  {
    topic: "July 2025: Weekend Classes with shivam ji",
    time: "Jul 5, 2025 06:30 PM India",
    zoomLink:
      "https://us02web.zoom.us/j/81450682018?pwd=GfJmnHd2kp750wjDIRd10aqEQwzNUj.1",
    meetingId: "814 5068 2018",
    passcode: "857309",
    whatsappLink: "https://chat.whatsapp.com/L6LzrBaOfo45iesHbejOX0",
    name: "Shivam",
  },
  {
    topic: "August 2025: Intermediate class with Anuj ji",
    time: "Aug 4, 2025 06:00 PM India",
    zoomLink: "https://bit.ly/Intermediate_Anuji_Zoom",
    meetingId: "820 8924 4265",
    passcode: "995772",
    whatsappLink: "https://bit.ly/Intermediate_Anuji_S",
    name: "Intermediate Alignment Based Class",
    subject:
      "Welcome to Your Online Intermediate Alignment Yoga Classes with Anuji",
    emailTemplate: "OrderConfirmationForLiveClassesAnujIntermediate.html",
  },
];
const maxAge = 3 * 24 * 60 * 60;
const createToken = (id) => {
  return jwt.sign({ id }, "PK@2023#", {
    expiresIn: maxAge,
  });
};

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

async function getPriceDetails(priceId) {
  const price = await stripe.prices.retrieve(priceId);

  return {
    priceId: price.id,
    currency: price.currency,
    unitAmount: price.unit_amount,
    unitAmountDecimal: price.unit_amount_decimal,
    isRecurring: !!price.recurring,
    interval: price.recurring?.interval,
    productId: price.product,
  };
}

const decodeToken = (token) => {
  jwt.verify(token, "net ninja secret", (err, decodedToken) => {
    if (err) {
      console.log(err.message);
      let val = {
        status: "error",
      };
      return val;
    } else {
      let val = {
        status: "ok",
        user: decodeToken,
      };
      console.log(decodedToken);
      return val;
    }
  });
};

module.exports = {
  // doLogin: async function (req, res) {
  //     {
  //         // console.log(req.body);
  //         try{
  //             const email = req.body.email;
  //             const password = req.body.password;

  //             const user = await User.findOne({"email":email,"password":password});

  //             if(user){
  //                 res.json({ 'status':"ok",'user': user, 'msg': 'succesfully logged in' });
  //             }else{
  //                 res.json({ 'msg': 'User not found' });
  //             }

  //             // res.json(user);

  //         }
  //         catch(err){
  //             res.status(500).json({msg:err});
  //         }
  //     }
  // },
  // createUpdateUser: async function (req, res) {
  //     {

  //         try{
  //             if(req.body._id){
  //                 const user = await User.findOneAndUpdate({_id:req.body._id},req.body);
  //                 res.status(200).json({status:"ok",msg:`User updated Successfully`});
  //             }else{
  //                 const user = await User.create(req.body);
  //                 res.status(201).json({status:"ok", msg:"User Registerd Success",userId:user._id});
  //             }

  //         }
  //         catch(err) {
  //          res.status(400).json({err});
  //         }

  //     }
  // },
  createMentor: async function (req, res) {
    {
      try {
        if (req.body._id) {
          const user = await mentorModel.findOneAndUpdate(
            { _id: req.body._id },
            req.body,
          );
          res
            .status(200)
            .json({ status: "ok", msg: `User updated Successfully` });
        } else {
          const user = await mentorModel.create(req.body);
          res.status(201).json({
            status: "ok",
            msg: "User Registerd Success",
            userId: user._id,
          });
        }
      } catch (err) {
        res.status(400).json({ err });
      }
    }
  },

  getAllMentor: async function (req, res) {
    const user = await mentorModel.find({ isActive: true }).sort({ sortBy: 1 });
    res.status(200).json({ user });
  },

  getMentorById: async function (req, res) {
    try {
      const { id: userId } = req.params;

      const user = await mentorModel.findOne({ _id: userId });

      if (!user) {
        return res.status(404).json({ msg: `No Mentor with Id ${userId}` });
      }
      res.status(200).json({ data: user });
    } catch (err) {
      res.status(500).json({ msg: err });
    }
  },
  getMentorBySlug: async function (req, res) {
    try {
      const { id: userId } = req.params;

      const user = await mentorModel.findOne({ slug: userId });

      if (!user) {
        return res.status(404).json({ msg: `No Mentor with Id ${userId}` });
      }
      res.status(200).json({ data: user });
    } catch (err) {
      res.status(500).json({ msg: err });
    }
  },
  createslider: async function (req, res) {
    {
      try {
        if (req.body._id) {
          const user = await sliderModel.findOneAndUpdate(
            { _id: req.body._id },
            req.body,
          );
          res
            .status(200)
            .json({ status: "ok", msg: `slider updated Successfully` });
        } else {
          const user = await sliderModel.create(req.body);
          res.status(201).json({
            status: "ok",
            msg: "slider inserted Success",
            userId: user._id,
          });
        }
      } catch (err) {
        res.status(400).json({ err });
      }
    }
  },

  getimagesliderById: async function (req, res) {
    try {
      const { id: userId } = req.params;

      const user = await sliderModel.findOne({ _id: userId });

      if (!user) {
        return res.status(404).json({ msg: `No User with Id ${userId}` });
      }
      res.status(200).json({ data: user });
    } catch (err) {
      res.status(500).json({ msg: err });
    }
  },

  getSlider: async function (req, res) {
    const user = await sliderModel.find({ isActive: true });
    res.status(200).json({ data: user });
  },

  createCourse: async function (req, res) {
    {
      try {
        if (req.body._id) {
          const course = await courseModel.findOneAndUpdate(
            { _id: req.body._id },
            req.body,
          );
          res
            .status(200)
            .json({ status: "ok", msg: `Course updated Successfully` });
        } else {
          const course = await courseModel.create(req.body);
          res
            .status(201)
            .json({ status: "ok", msg: "Course Registerd Success" });
        }
      } catch (err) {
        res.status(400).json({ err });
      }
    }
  },
  getAllCourse: async function (req, res) {
    let size = req.body.size || 10;
    let pageNo = req.body.pageNo || 1;
    const query = {};
    query.skip = Number(size * (pageNo - 1));
    query.limit = Number(size) || 0;
    const sort = { _id: -1 };
    const totalCourse = await courseModel.find({ isActive: true });
    const course = await courseModel
      .find({ isActive: true })
      .skip(query.skip)
      .limit(query.limit);
    res.status(200).json({ data: course, total: totalCourse.length });
  },

  getAllWebinarRegistration: async function (req, res) {
    let size = req.body.size || 10;
    let pageNo = req.body.pageNo || 1;
    const query = {};
    query.skip = Number(size * (pageNo - 1));
    query.limit = Number(size) || 0;
    const sort = { _id: -1 };
    const totalUsers = await webinarUser.find();
    const users = await webinarUser
      .find()
      .sort(sort)
      .skip(query.skip)
      .limit(query.limit);
    res.status(200).json({ data: users, total: totalUsers.length });
  },

  getAllSubscribers: async function (req, res) {
    let size = req.body.size || 10;
    let pageNo = req.body.pageNo || 1;
    let searchText = req.body.searchText || "";
    const query = {};
    if (searchText) {
      query.$or = [
        { name: { $regex: searchText, $options: "i" } },
        { email: { $regex: searchText, $options: "i" } },
      ];
    }
    const skip = Number(size * (pageNo - 1));
    const limit = Number(size) || 0;
    const sort = { _id: -1 };

    // Pass the query (which might contain the search filter) to both find calls
    const totalSubscribers = await subscribeModel.find(query);
    const subscribers = await subscribeModel
      .find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit);
    res.status(200).json({ data: subscribers, total: totalSubscribers.length });
  },
  getAllCourseV2: async function (req, res) {
    try {
      let documentIds = [
        "63c3f26c461e531f3c3452e1",
        "63c4de4a2bce43a907211c74",
        "63c4e12f2bce43a907211c76",
        "63c4e7e72bce43a907211c78",
        "63c4eea32bce43a907211c7a",
        "644f9dfc499ffcfb45df35cd",
        "63fc3fdc6d203300eae38625",
      ];
      const course = await courseModel.find(
        { isActive: true, _id: { $in: documentIds } },
        { _id: 1, coursetitle: 1 },
      );
      res.status(200).json({ data: course });
    } catch (err) {
      res.status(500).json({ msg: "Internal Server error" });
    }
  },
  getAllCourseAdmin: async function (req, res) {
    try {
      const course = await courseModel.find({ isActive: true });
      res.status(200).json({ data: course });
    } catch (err) {
      res.status(500).json({ msg: "Internal Server error" });
    }
  },
  getCourseById: async function (req, res) {
    console.log(req.params);
    try {
      const { id: cId } = req.params;

      const course = await courseModel.findOne({ _id: cId });

      if (!course) {
        return res.status(404).json({ msg: `No course with Id ${cId}` });
      }
      res.status(200).json({ data: course });
    } catch (err) {
      res.status(500).json({ msg: err });
    }
  },
  getCourseBySlug: async function (req, res) {
    try {
      let result = await courseService.getCourseBySlug(req.body.slug);
      res.status(result.status).json(result.data);
    } catch (err) {
      res.status(500).json({ msg: "Internal Server error" });
    }
  },

  registerWebinarUser: async function (req, res) {
    const {
      name,
      email,
      phone,
      city,
      company,
      webinar,
      refferalCode,
      password,
    } = req.body;
    let mailOptions;
    let created = new Date();
    // Validate required fields
    if (!name || !email || !refferalCode) {
      return res
        .status(400)
        .json({ message: "Name, email, refferal Code are required." });
    }

    try {
      // Create new user
      const newUser = new webinarUser({
        name,
        email,
        phone,
        city,
        company,
        webinar,
        refferalCode,
        password,
        created,
      });

      // Save user to database
      await newUser.save();
      // Send mail
      const filePath = path.join(
        __dirname,
        "/emailTemplate/registerWebinar.html",
      );
      const source = fs.readFileSync(filePath, "utf-8").toString();
      const template = handlebars.compile(source);
      const replacements = {
        name: name,
        webinar: webinar,
        email: email,
        password: password,
      };
      const htmlToSend = template(replacements);

      mailOptions = {
        from: "Yoga Vidya School info@yogavidyaschool.com",
        to: email,
        subject: `${webinar} webinar registration confirmation`,
        replyTo: "info@yogavidyaschool.com",
        html: htmlToSend,
      };
      transporter.sendMail(mailOptions, async (err, result) => {
        if (err) {
          res.status(400).json("Opps error occured");
        } else {
          res
            .status(201)
            .json({ message: "User registered successfully!", user: newUser });
        }
      });
    } catch (error) {
      if (error.code === 11000) {
        // Duplicate email error
        res.status(400).json({ message: "Email already registered." });
      } else {
        res.status(500).json({ message: "Server error", error });
      }
    }
  },

  checkoutSwarSadhanaStripe: async function (req, res) {
    try {
      let result = await paymentService.checkoutSwarSadhanaStripe(req.body);
      res.status(200).json(result);
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  },

  getPaymentResultSwarSadhana: async function (req, res) {
    try {
      const session = await stripe.checkout.sessions.retrieve(
        req.body.sessionId,
      );
      if (session.payment_status == "paid") {
        let val = {
          userId: req.body.userId,
        };

        try {
          const pay = await webinarUser.findOneAndUpdate(
            { _id: val.userId },
            {
              paymentStatus: "paid",
              paymentId: session.payment_intent,
              refferalCode: "swarayoga@prashantji",
            },
          );
          const dbTimeSlot = await timeSlots.findOne({ _id: pay.timeSlot });
          const { startTime, timeBefore } = getTimeBefore(
            dbTimeSlot.slotDuration,
          );
          // Send mail
          const filePath = path.join(
            __dirname,
            "/emailTemplate/swarayoga.html",
          );
          const source = fs.readFileSync(filePath, "utf-8").toString();
          const template = handlebars.compile(source);
          const replacements = {
            name: pay.name,
            webinar: pay.webinar,
            whatsappGroupLink: dbTimeSlot.whatsAppGroupLink,
            webinarDate: dbTimeSlot.webinarDate.toDateString(),
            zoomLink: dbTimeSlot.zoomLink,
            slotDuration: startTime,
            slotStartTenMinBefore: timeBefore,
            email: pay.email,
            password: pay.password,
          };
          const htmlToSend = template(replacements);

          let mailOptions = {
            from: "Yoga Vidya School info@yogavidyaschool.com",
            to: pay.email,
            subject: `${pay.webinar} webinar registration confirmation`,
            replyTo: "info@yogavidyaschool.com",
            html: htmlToSend,
          };

          const messageData = {
            messaging_product: "whatsapp",
            to: pay.phone,
            type: "template",
            template: {
              name: "swar_sadhana",
              language: {
                code: "en_US",
              },
              components: [
                {
                  type: "header",
                  parameters: [
                    { type: "text", text: pay.name }, // {{1}} in header — user's name
                  ],
                },
                {
                  type: "body",
                  parameters: [
                    { type: "text", text: dbTimeSlot.whatsAppGroupLink }, // {{1}} in body
                    {
                      type: "text",
                      text: dbTimeSlot.webinarDate.toDateString(),
                    }, // {{2}} in body
                    { type: "text", text: dbTimeSlot.zoomLink }, // {{3}} in body
                    { type: "text", text: startTime }, // {{4}} in body
                    { type: "text", text: timeBefore }, // {{5}} in body
                    { type: "text", text: pay.email }, // {{6}} in body
                    { type: "text", text: pay.password }, // {{7}} in body
                    { type: "text", text: pay.webinar }, // {{8}} in body
                  ],
                },
              ],
            },
          };
          var priceDetails = await getPriceDetails(pay.priceId);
          const clientData = req ? extractClientData(req) : {};
          paymentTrackingService.trackSwaraSadhanaPurchase(
            {
              paymentId: session.payment_intent,
              ...clientData,
            },
            {
              ...pay,
              currency: priceDetails.currency,
              amount: priceDetails.unitAmount / 100,
            },
          );

          transporter.sendMail(mailOptions, async (err, result) => {
            if (err) {
              res.status(400).json("Opps error occured");
            } else {
              res.status(200).json({
                status: "success",
                sessionId: req.body.sessionId,
                paymtId: session.payment_intent,
                currency: priceDetails.currency,
                amount: priceDetails.unitAmount / 100,
              });
            }
          });
        } catch (e) {
          console.log("email send error!");
        }
      } else {
        const pay = await webinarUser.findOneAndUpdate(
          { _id: req.body.userId },
          { paymentStatus: "failed" },
        );
        res
          .status(200)
          .json({ status: "failed", sessionId: req.body.sessionId });
      }
    } catch (error) {
      res.status(500).json("Internal server error");
    }
  },
  checkoutRazorpayNewSwarSadhana: async function (req, res) {
    try {
      let result = await paymentService.checkoutRazorpayNewSwarSadhana(
        req.body,
      );
      res.setHeader("Access-Control-Expose-Headers", "x-rtb-fingerprint-id");
      res.status(200).json(result);
    } catch (err) {
      console.error(err);
      res.status(500).send("Internal Server Error");
    }
  },

  getRazorPaymentResultSwarSadhana: async function (req, res) {
    try {
      const {
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature,
        userId,
      } = req.body;

      const generated_signature = crypto
        .createHmac("sha256", razorpay.key_secret)
        .update(razorpay_order_id + "|" + razorpay_payment_id)
        .digest("hex");

      if (generated_signature === razorpay_signature) {
        try {
          const pay = await webinarUser.findOneAndUpdate(
            { _id: userId },
            {
              paymentStatus: "paid",
              refferalCode: "swarayoga@prashantji",
            },
          );

          const dbTimeSlot = await timeSlots.findOne({ _id: pay.timeSlot });
          const { startTime, timeBefore } = getTimeBefore(
            dbTimeSlot.slotDuration,
          );

          // Email Template
          const filePath = path.join(
            __dirname,
            "/emailTemplate/swarayoga.html",
          );
          const source = fs.readFileSync(filePath, "utf-8").toString();
          const template = handlebars.compile(source);
          const replacements = {
            name: pay.name,
            webinar: pay.webinar,
            whatsappGroupLink: dbTimeSlot.whatsAppGroupLink,
            webinarDate: dbTimeSlot.webinarDate.toDateString(),
            zoomLink: dbTimeSlot.zoomLink,
            slotDuration: startTime,
            slotStartTenMinBefore: timeBefore,
            email: pay.email,
            password: pay.password,
          };
          const htmlToSend = template(replacements);

          const mailOptions = {
            from: "Yoga Vidya School info@yogavidyaschool.com",
            to: pay.email,
            subject: `${pay.webinar} webinar registration confirmation`,
            replyTo: "info@yogavidyaschool.com",
            html: htmlToSend,
          };

          const messageData = {
            messaging_product: "whatsapp",
            to: pay.phone,
            type: "template",
            template: {
              name: "swar_sadhana",
              language: { code: "en_US" },
              components: [
                {
                  type: "header",
                  parameters: [{ type: "text", text: pay.name }],
                },
                {
                  type: "body",
                  parameters: [
                    { type: "text", text: dbTimeSlot.whatsAppGroupLink },
                    {
                      type: "text",
                      text: dbTimeSlot.webinarDate.toDateString(),
                    },
                    { type: "text", text: dbTimeSlot.zoomLink },
                    { type: "text", text: startTime },
                    { type: "text", text: timeBefore },
                    { type: "text", text: pay.email },
                    { type: "text", text: pay.password },
                    { type: "text", text: pay.webinar },
                  ],
                },
              ],
            },
          };

          transporter.sendMail(mailOptions, async (err, result) => {
            if (err) {
              res.status(400).json("Oops error occurred");
            } else {
            }
          });

          const clientData = req ? extractClientData(req) : {};
          paymentTrackingService.trackSwaraSadhanaPurchase(
            {
              paymentId: razorpay_payment_id,
              ...clientData,
            },
            {
              ...pay,
              currency: req.body.currency,
              amount: req.body.amount,
            },
          );

          res.status(200).json({
            status: "success",
            paymentId: razorpay_payment_id,
          });
        } catch (e) {
          console.log("Email send error!", e);
          res.status(500).json("Internal error after payment success");
        }
      } else {
        await webinarUser.findOneAndUpdate(
          { _id: userId },
          { paymentStatus: "failed" },
        );
        res
          .status(200)
          .json({ status: "failed", paymentId: razorpay_payment_id });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json("Internal server error");
    }
  },

  registerSwarSadhanaWebinarUser: async function (req, res) {
    try {
      let result = await adminService.registerSwarSadhanaWebinarUser(req.body);
      res.status(result.status).json(result.data);
    } catch (error) {
      if (error.code === 11000) {
        res.status(400).json({ message: "Email already registered." });
      } else {
        res.status(500).json({ message: "Server error", error });
      }
    }
  },
  registerPranicPurificationUser: async function (req, res) {
    try {
      let result = await adminService.registerPranicPurificationUser(req.body);
      res.status(result.status).json(result.data);
    } catch (error) {
      if (error.code === 11000) {
        res.status(400).json({ message: "Email already registered." });
      } else {
        res.status(500).json({ message: "Server error", error });
      }
    }
  },
  registerPranicPurificationIIUser: async function (req, res) {
    try {
      let result = await adminService.registerPranicPurificationIIUser(req.body);
      res.status(result.status).json(result.data);
    } catch (error) {
      if (error.code === 11000) {
        res.status(400).json({ message: "Email already registered." });
      } else {
        res.status(500).json({ message: "Server error", error });
      }
    }
  },
  register200TTCUser: async function (req, res) {
    try {
      let result = await adminService.register200TTCUser(req.body);
      res.status(result.status).json(result.data);
    } catch (error) {
      if (error.code === 11000) {
        res.status(400).json({ message: "Email already registered." });
      } else {
        res.status(500).json({ message: "Server error", error });
      }
    }
  },

  getAllTimeSlot: async function (req, res) {
    try {
      const allTimeSlot = await timeSlots.find({}, "slotDuration _id"); // Fetch only slotDuration and _id
      res.status(200).json(allTimeSlot);
    } catch (error) {
      res
        .status(500)
        .json({ error: "Error fetching time slots", details: error.message });
    }
  },

  createCategory: async function (req, res) {
    {
      try {
        if (req.body._id) {
          const user = await categoryModel.findOneAndUpdate(
            { _id: req.body._id },
            req.body,
          );
          res
            .status(200)
            .json({ status: "ok", msg: `category updated Successfully` });
        } else {
          const user = await categoryModel.create(req.body);
          res.status(201).json({
            status: "ok",
            msg: "category Registerd Success",
            categoryId: user._id,
          });
        }
      } catch (err) {
        res.status(400).json({ err });
      }
    }
  },
  checkEmail: async function (req, res) {
    try {
      const checkUser = await studentModel.countDocuments({
        isActive: true,
        email: req.body.email,
      });
      const user = await studentModel.findOne({
        isActive: true,
        email: req.body.email,
      });

      if (checkUser > 0) {
        let check = await studentModel.countDocuments({
          _id: user._id,
          course: { $in: req.body.course },
        });
        res.status(200).json({
          status: "ok",
          id: user._id,
          coursePurchased: check > 0 ? true : false,
        });
      } else {
        res.status(200).json({ status: "error" });
      }
    } catch (err) {
      res.status(500).json({ msg: err });
    }
  },
  getCategoryById: async function (req, res) {
    try {
      const { id: userId } = req.params;

      const user = await categoryModel.findOne({ _id: userId });

      if (!user) {
        return res.status(404).json({ msg: `No User with Id ${userId}` });
      }
      res.status(200).json({ data: user });
    } catch (err) {
      res.status(500).json({ msg: err });
    }
  },

  inquiryEmail: async function (req, res) {
    const {
      to,
      message,
      name,
      courseName,
      contactNumber,
      startDate,
      courseDate,
      type,
      subject,
      package,
    } = req.body;
    try {
      if (to) {
        if (to.trim() === "") throw new Error("Invalid recipent email");
      } else throw new Error("Invalid receipt email");
      if (name) {
        if (name.trim() === "") throw new Error("Kindly add name");
      } else throw new Error("Kindly add name");

      let mailOptions;
      let dbBody;
      if (courseName == "Best Online Yoga Classes") {
        if (
          startDate != "5.30 AM – 6.30 AM" &&
          startDate != "6.30 AM – 7.30 AM" &&
          startDate != "10:30 AM – 11:30 AM" &&
          startDate != "5.30 PM – 6.30 PM"
        ) {
          res
            .status(200)
            .json({ status: "ok", msg: "Select different time slot" });
          return;
        }
      }

      if (type == 1) {
        const filePath = path.join(__dirname, "/emailTemplate/testEmail.html");
        const source = fs.readFileSync(filePath, "utf-8").toString();
        const template = handlebars.compile(source);
        const replacements = {
          studentEmail: to,
          studentName: name,
          courseName: courseName,
          contact: contactNumber,
          startDate: startDate,
          message: message,
          package: package,
        };
        const htmlToSend = template(replacements);

        mailOptions = {
          from: "Yoga Vidya School info@yogavidyaschool.com",
          to: "info@yogavidyaschool.com",
          subject: `You have a new course enquiry - ${courseName}`,
          // text: body,
          replyTo: to,
          html: htmlToSend,
        };
        dbBody = {
          name: name,
          email: to,
          contact: contactNumber,
          course: courseName,
          message: message,
          courseDate: courseDate,
          type: type,
          package: package,
        };
      } else {
        const filePath = path.join(
          __dirname,
          "/emailTemplate/testEmailV2.html",
        );
        const source = fs.readFileSync(filePath, "utf-8").toString();
        const template = handlebars.compile(source);
        const replacements = {
          studentEmail: to,
          studentName: name,
          subject: subject,
          message: message,
        };
        const htmlToSend = template(replacements);

        mailOptions = {
          from: "Yoga Vidya School info@yogavidyaschool.com",
          to: "info@yogavidyaschool.com",
          subject: `You have a new contact enquiry`,
          // text: body,
          replyTo: to,
          html: htmlToSend,
        };
        dbBody = {
          name: name,
          email: to,
          subject: subject,
          message: message,
          type: type,
        };
      }
      transporter.sendMail(mailOptions, async (err, result) => {
        if (err) {
          res.status(400).json("Opps error occured");
        } else {
          const inq = await inquiryModel.create(dbBody);
          res.status(200).json({ status: "ok", msg: "Enquiry has been sent!" });
        }
      });
    } catch (error) {
      res.status(400).json(error.message);
    }
  },
  createBlog: async function (req, res) {
    {
      try {
        if (req.body._id) {
          req.body.authorId = mongoose.Types.ObjectId(req.body.authorId);
          const blog = await blogModel.findOneAndUpdate(
            { _id: req.body._id },
            req.body,
          );
          res
            .status(200)
            .json({ status: "ok", msg: `Blog updated Successfully` });
        } else {
          req.body.authorId = mongoose.Types.ObjectId(req.body.authorId);
          const blog = await blogModel.create(req.body);
          res.status(201).json({ status: "ok", msg: "Blog Registerd Success" });
        }
      } catch (err) {
        res.status(400).json({ err });
      }
    }
  },
  getAllBlog: async function (req, res) {
    let size = req.body.size || 10;
    let pageNo = req.body.pageNo || 1;
    const query = {};
    query.skip = Number(size * (pageNo - 1));
    query.limit = Number(size) || 0;
    const sort = { _id: -1 };
    const totalBlog = await blogModel.count({ isActive: true });
    if (totalBlog > 0) {
      const blog = await blogModel
        .find({ isActive: true })
        .sort(sort)
        .skip(query.skip)
        .limit(query.limit);
      res.status(200).json({ data: blog, total: totalBlog });
    } else {
      res.status(200).json({ data: [{}], total: totalBlog });
    }
  },
  getBlogById: async function (req, res) {
    try {
      const { id: userId } = req.params;

      const user = await blogModel.findOne({ _id: userId });

      if (!user) {
        return res.status(404).json({ msg: `No Blog with Id ${userId}` });
      }
      res.status(200).json({ data: user });
    } catch (err) {
      res.status(500).json({ msg: err });
    }
  },
  getBlogBySlug: async function (req, res) {
    try {
      const { id: slug } = req.params;

      const user = await blogModel.findOne({ isActive: true, slug: slug });

      if (!user) {
        return res.status(200).json({ data: [], msg: `No Blog with Slug` });
      }

      res.status(200).json({ data: user });
    } catch (err) {
      res.status(500).json({ msg: err });
    }
  },
  getAllHomeBlog: async function (req, res) {
    const limit = Number(req.body.limit);
    // const blog = await blogModel.aggregate([{ $match: { isActive: true } },{ $sample: { size: limit } },{ $limit: limit }]);
    const blog = await blogModel
      .find({ isActive: true })
      .sort({ _id: -1 })
      .limit(limit);
    res.status(200).json({ data: blog });
  },
  getHomeMentors: async function (req, res) {
    const value = Number(req.body.limit);
    const total = await mentorModel.countDocuments({ isActive: true });
    const mentor = await mentorModel
      .find({ isActive: true, sortBy: { $gte: value, $lte: value + 3 } })
      .sort({ sortBy: 1 });
    res.status(200).json({ data: mentor, total: total });
  },
  getMentorsForCoursePage: async function (req, res) {
    const value = Number(req.body.limit);
    const total = await mentorModel.countDocuments({ isActive: true });
    const mentor = await mentorModel
      .find({ isActive: true })
      .limit(value)
      .sort({ sortBy: 1 });
    res.status(200).json({ data: mentor, total: total });
  },
  createMedia: async function (req, res) {
    {
      try {
        if (req.body._id) {
          const blog = await mediaModel.findOneAndUpdate(
            { _id: req.body._id },
            req.body,
          );
          res
            .status(200)
            .json({ status: "ok", msg: `Media updated Successfully` });
        } else {
          const blog = await mediaModel.create(req.body);
          res.status(201).json({ status: "ok", msg: "Media Upload Success" });
        }
      } catch (err) {
        res.status(400).json({ err });
      }
    }
  },
  getAllMedia: async function (req, res) {
    const blog = await mediaModel.find({ isActive: true });
    res.status(200).json({ data: blog });
  },
  createPage: async function (req, res) {
    {
      try {
        if (req.body._id) {
          const page = await pageModel.findOneAndUpdate(
            { _id: req.body._id },
            req.body,
          );
          res
            .status(200)
            .json({ status: "ok", msg: `Page updated Successfully` });
        } else {
          const page = await pageModel.create(req.body);
          res.status(201).json({ status: "ok", msg: "Page Registerd Success" });
        }
      } catch (err) {
        res.status(400).json({ err });
      }
    }
  },
  getAllPages: async function (req, res) {
    const page = await pageModel.find({ isActive: true });
    res.status(200).json({ data: page });
  },
  getPageById: async function (req, res) {
    try {
      const { id: pageId } = req.params;

      const page = await pageModel.findOne({ _id: pageId });

      if (!page) {
        return res.status(404).json({ msg: `No Page with Id ${pageId}` });
      }
      res.status(200).json({ data: page });
    } catch (err) {
      res.status(500).json({ msg: err });
    }
  },

  createTestimonial: async function (req, res) {
    {
      try {
        if (req.body._id) {
          const test = await testimonialModel.findOneAndUpdate(
            { _id: req.body._id },
            req.body,
          );
          res
            .status(200)
            .json({ status: "ok", msg: `Testimonial updated Successfully` });
        } else {
          const test = await testimonialModel.create(req.body);
          res
            .status(201)
            .json({ status: "ok", msg: "Testimonial Registerd Success" });
        }
      } catch (err) {
        res.status(400).json({ err });
      }
    }
  },
  getAllTestimonial: async function (req, res) {
    const test = await testimonialModel.find({ isActive: true });
    res.status(200).json({ data: test });
  },
  createSubcategory: async function (req, res) {
    {
      try {
        if (req.body._id) {
          const subcat = await subcategoryModel.findOneAndUpdate(
            { _id: req.body._id },
            req.body,
          );
          res
            .status(200)
            .json({ status: "ok", msg: `subcategory updated Successfully` });
        } else {
          const subcat = await subcategoryModel.create(req.body);
          res
            .status(201)
            .json({ status: "ok", msg: "subcategory Registerd Success" });
        }
      } catch (err) {
        res.status(400).json({ err });
      }
    }
  },
  getAllSubCategory: async function (req, res) {
    const data = await subcategoryModel.find({ isActive: true });
    res.status(200).json({ data });
  },
  getAllCatV2: async function (req, res) {
    const data = await categoryModel.find({ isActive: true });
    res.status(200).json({ data });
  },
  getSubCategoryById: async function (req, res) {
    try {
      const { id: userId } = req.params;

      const user = await subcategoryModel.findOne({ _id: userId });

      if (!user) {
        return res.status(404).json({ msg: `No subcat with Id ${userId}` });
      }
      res.status(200).json({ data: user });
    } catch (err) {
      res.status(500).json({ msg: err });
    }
  },
  createSubCoursecategory: async function (req, res) {
    {
      try {
        if (req.body._id) {
          const subcat = await subcoursecategoryModel.findOneAndUpdate(
            { _id: req.body._id },
            req.body,
          );
          res.status(200).json({
            status: "ok",
            msg: `subcategory course updated Successfully`,
          });
        } else {
          const subcat = await subcoursecategoryModel.create(req.body);
          res.status(201).json({
            status: "ok",
            msg: "subcategory course Registerd Success",
          });
        }
      } catch (err) {
        res.status(400).json({ err });
      }
    }
  },
  getAllSubCourseCategory: async function (req, res) {
    const data = await subcoursecategoryModel.find({ isActive: true });
    res.status(200).json({ data });
  },
  getSubCourseCategoryById: async function (req, res) {
    try {
      const { id: userId } = req.params;

      const user = await subcoursecategoryModel.findOne({ _id: userId });

      if (!user) {
        return res
          .status(404)
          .json({ msg: `No subcat course with Id ${userId}` });
      }
      res.status(200).json({ data: user });
    } catch (err) {
      res.status(500).json({ msg: err });
    }
  },
  getSubCategoryByCatId: async function (req, res) {
    let catId = req.body.catId;
    const data = await subcategoryModel.find({ categoryId: catId });
    res.status(200).json({ data });
  },
  getSubCourseCategoryBySubCatId: async function (req, res) {
    let subcatId = req.body.subcatId;
    const data = await subcoursecategoryModel.find({ subcategoryId: subcatId });
    res.status(200).json({ data });
  },
  getCategoryTree: async function (req, res) {
    let data = await categoryTreeModel.findOne({});
    res.status(200).json({ data });
  },
  createEvent: async function (req, res) {
    {
      try {
        if (req.body._id) {
          const event = await eventModel.findOneAndUpdate(
            { _id: req.body._id },
            req.body,
          );
          res
            .status(200)
            .json({ status: "ok", msg: `Event updated Successfully` });
        } else {
          const event = await eventModel.create(req.body);
          res
            .status(201)
            .json({ status: "ok", msg: "Event Registerd Success" });
        }
      } catch (err) {
        res.status(400).json({ err });
      }
    }
  },
  getAllEventsAdmin: async function (req, res) {
    let data = await eventModel.find({ isActive: true }).sort({ startDate: 1 });
    res.status(200).json({ data });
  },
  getAllEvents: async function (req, res) {
    let date = new Date();
    const targetDateFormatted = date.toISOString().split("T")[0];
    let data = await eventModel
      .find({
        startDate: { $gte: targetDateFormatted },
        isActive: true,
        type: "offline",
      })
      .sort({ startDate: 1 })
      .limit(4);
    res.status(200).json({ data });
  },
  getAllOnlineEvents: async function (req, res) {
    let date = new Date();
    // const targetDateFormatted = date.toISOString().split('T')[0];
    let data = await eventModel
      .find({ isActive: true, type: "online" })
      .limit(4);
    res.status(200).json({ data });
  },
  saveContactInquiry: async function (req, res) {
    {
      try {
        if (req.body._id) {
          const contact = await inquiryModel.findOneAndUpdate(
            { _id: req.body._id },
            req.body,
          );
          res.status(200).json({ status: "ok", msg: `Updated Successfully` });
        } else {
          const contact = await inquiryModel.create(req.body);
          res.status(201).json({ status: "ok", msg: "Inserted Success" });
        }
      } catch (err) {
        res.status(400).json({ err });
      }
    }
  },
  createAdmin: async function (req, res) {
    {
      try {
        if (req.body._id) {
          const user = await adminModel.findOneAndUpdate(
            { _id: req.body._id },
            req.body,
          );
          res
            .status(200)
            .json({ status: "ok", msg: `Admin updated Successfully` });
        } else {
          const user = await adminModel.create(req.body);
          res
            .status(201)
            .json({ status: "ok", msg: "admin Registerd Success" });
        }
      } catch (err) {
        res.status(400).json({ err });
      }
    }
  },
  doLogin: async function (req, res) {
    try {
      const email = req.body.email;
      const password = req.body.password;

      const user = await adminModel.findOne({
        email: email,
        password: password,
      });
      if (user) {
        const token = createToken(user._id);
        res.json({ status: "ok", token, user, msg: "succesfully logged in" });
      } else {
        res.json({ msg: "User not found" });
      }

      // res.json(user);
    } catch (err) {
      res.status(500).json({ msg: err });
    }
  },
  loginWeb: async function (req, res) {
    try {
      const email = req.body.email.replace(/\s/g, "");
      const password = req.body.password.replace(/\s/g, "");

      const user = await studentModel.findOne({
        isActive: true,
        email: email,
        password: password,
      });

      if (user) {
        res.status(200).json({
          status: "ok",
          user: { id: user._id, isWebinarUser: false },
          msg: "succesfully logged in",
        });
      } else {
        const webinarUserData = await webinarUser.findOne({
          email: email,
          password: password,
        });
        if (webinarUserData) {
          const currentTime = new Date();
          const webinarDate = new Date(2025, 5, 16, 0, 0, 0);
          if (currentTime < webinarDate) {
            res.status(200).json({
              status: "ok",
              msg: "Please access from 16 June at 12 AM",
            });
            return;
          }
          if (!webinarUserData.lastTimeLoggedIn) {
            webinarUserData.lastTimeLoggedIn = new Date(); // Set current timestamp
            await webinarUserData.save(); // Save the updated document
          } else {
            // If lastTimeLoggedIn has a value, check if 48 hours have passed
            const lastLoggedInTime = new Date(webinarUserData.lastTimeLoggedIn);
            const timeAfter96Hours = new Date(
              lastLoggedInTime.getTime() + 24 * 30 * 60 * 60 * 1000,
            ); // Add 48 hours

            if (currentTime > timeAfter96Hours) {
              res.status(200).json({
                status: "ok",
                msg: "You exceed the 1 month time after logged in",
              });
              return;
            }
          }
          res.status(200).json({
            status: "ok",
            user: { id: webinarUserData._id, isWebinarUser: true },
            msg: "succesfully logged in",
          });
        } else {
          res.status(200).json({ status: "ok", msg: "User not found" });
        }
      }

      // res.json(user);
    } catch (err) {
      res.status(500).json({ msg: err });
    }
  },
  getCourseByIdV2: async function (req, res) {
    try {
      const { id: stuId } = req.params;
      const course = await courseModel.findOne({ _id: stuId });
      if (!course) {
        return res.status(200).json({ msg: `No course with Id ${stuId}` });
      }
      res.status(200).json({ course });
    } catch (err) {
      res.status(500).json({ msg: err });
    }
  },
  getValidation: async function (req, res) {
    // console.log(req.body);
    try {
      const id = req.body.userId;

      const checkUser = await studentModel.countDocuments({ course: id });

      if (checkUser > 0) {
        res.status(200).json({ status: "ok" });
      } else {
        res.status(200).json({ status: "error" });
      }
    } catch (err) {
      res.status(500).json({ msg: err });
    }
  },

  createFeedback: async function (req, res) {
    {
      // try{
      if (req.body._id) {
        const blog = await feedbackModel.findOneAndUpdate(
          { _id: req.body._id },
          req.body,
        );
        res
          .status(200)
          .json({ status: "ok", msg: `feedback updated Successfully` });
      } else {
        let mailOptions;
        let course = await courseModel.findOne({ _id: req.body.courseId });
        let student = await studentModel.findOne({ _id: req.body.studentId });
        let replacements = {};
        let template;
        if (course.coursetitle == "Breath Detox Course Online") {
          const filePath = path.join(
            __dirname,
            "/emailTemplate/breathDetox.html",
          );
          const source = fs.readFileSync(filePath, "utf-8").toString();
          template = handlebars.compile(source);
          replacements = {
            course: course.coursetitle,
            student: student.firstName,
            questionList: req.body.questionList,
            answerList: req.body.answerList,
            video: req.body.videoReview,
            day: req.body.day,
          };
        } else {
          const filePath = path.join(
            __dirname,
            "/emailTemplate/feedbackMail.html",
          );
          const source = fs.readFileSync(filePath, "utf-8").toString();
          template = handlebars.compile(source);
          replacements = {
            course: course.coursetitle,
            student: student.firstName,
            question1: req.body.question1,
            question2: req.body.question2,
            question3: req.body.question3,
            video: req.body.videoReview,
            day: req.body.day,
          };
        }
        // const filePath = path.join(__dirname, '/emailTemplate/feedbackMail.html');
        // const source = fs.readFileSync(filePath, 'utf-8').toString();
        // const template = handlebars.compile(source);
        // const replacements = {
        //     "course":course.coursetitle,
        //     "student":student.firstName,
        //     "question1":req.body.question1,
        //     "question2":req.body.question2,
        //     "question3":req.body.question3,
        // };
        const htmlToSend = template(replacements);

        mailOptions = {
          from: "Yoga Vidya School info@yogavidyaschool.com",
          to: "info@yogavidyaschool.com",
          subject: `You have a course Feedback - ${course.coursetitle} Day - ${req.body.day}`,
          // text: body,
          replyTo: student.email,
          html: htmlToSend,
        };

        transporter.sendMail(mailOptions, async (err, result) => {
          if (err) {
            res.status(400).json("Opps error occured");
          } else {
            const blog = await feedbackModel.create(req.body);
            res
              .status(200)
              .json({ status: "ok", msg: "Feedback has been sent!" });
          }
        });
      }

      // }
      // catch(err) {
      //  res.status(400).json({err});
      // }
    }
  },
  getFeedbackByCourse: async function (req, res) {
    try {
      const feedback = await feedbackModel.countDocuments({
        courseId: req.body.courseId,
        studentId: req.body.studentId,
        day: req.body.day,
      });
      if (feedback > 0) {
        // const feedbackdata = await feedbackModel.findOne({hashed_id:req.body.hash,studentId:req.body.studentId});
        res.status(200).json({ count: 1 });
      } else {
        res.status(200).json({ count: 0 });
      }
    } catch (err) {
      res.status(500).json({ msg: err });
    }
  },
  createAccessLog: async function (req, res) {
    {
      try {
        if (req.body._id) {
          const user = await accesslogModel.findOneAndUpdate(
            { _id: req.body._id },
            req.body,
          );
          res.status(200).json({ status: "ok", msg: `success` });
        } else {
          const user = await accesslogModel.create(req.body);
          res.status(201).json({ status: "ok", msg: "success" });
        }
      } catch (err) {
        res.status(400).json({ err });
      }
    }
  },
  getAccessLog: async function (req, res) {
    try {
      const access = await accesslogModel.countDocuments({
        courseId: req.body.courseId,
        studentId: req.body.studentId,
      });
      const accesslog = await accesslogModel.findOne({
        courseId: req.body.courseId,
        studentId: req.body.studentId,
      });
      if (access > 0) {
        res.status(200).json({ count: 1, data: accesslog });
      } else {
        res.status(200).json({ count: 0 });
      }
    } catch (err) {
      res.status(500).json({ msg: err });
    }
  },
  getcheckCourseStudent: async function (req, res) {
    // console.log(req.body);
    let check = await studentModel.countDocuments({
      _id: req.body.student,
      course: { $in: req.body.course },
    });
    // console.log(check);
    if (check > 0) {
      res.status(200).json({ count: 1 });
    } else {
      res.status(200).json({ count: 0 });
    }
  },

  getAllVideoReviews: async function (req, res) {
    let size = req.body.size || 10;
    let pageNo = req.body.pageNo || 1;
    const query = {};
    query.skip = Number(size * (pageNo - 1));
    query.limit = Number(size) || 0;
    const sort = { _id: -1 };
    const totalFeedback = await feedbackModel.countDocuments({
      day: "5",
      videoReview: { $exists: true, $ne: "" },
    });

    const feedback = await feedbackModel.aggregate([
      {
        $match: { day: "5", videoReview: { $exists: true, $ne: "" } },
      },
      {
        $lookup: {
          from: "courses",
          let: { localFieldId: "$courseId" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", { $toObjectId: "$$localFieldId" }] },
              },
            },
            {
              $project: {
                coursetitle: 1,
              },
            },
          ],
          as: "courseData",
        },
      },
      {
        $lookup: {
          from: "students",
          let: { localFieldId: "$studentId" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", { $toObjectId: "$$localFieldId" }] },
              },
            },
            {
              $project: {
                firstName: 1,
              },
            },
          ],
          as: "studentData",
        },
      },
      {
        $skip: query.skip, // Number of documents to skip
      },
      {
        $limit: query.limit, // Number of documents to limit
      },
    ]);
    // const feedback = await feedbackModel.find({day:5,videoReview:{$exists:true,$ne:''}}).skip(query.skip).limit(query.limit);
    res.status(200).json({ data: feedback, total: totalFeedback });
  },

  getAllInquiry: async function (req, res) {
    let size = req.body.size || 10;
    let pageNo = req.body.pageNo || 1;
    const query = {};
    query.skip = Number(size * (pageNo - 1));
    query.limit = Number(size) || 0;
    const sort = { _id: -1 };
    const totalCourse = await inquiryModel.countDocuments({ isActive: true });
    const course = await inquiryModel
      .find({ isActive: true })
      .sort(sort)
      .skip(query.skip)
      .limit(query.limit);
    res.status(200).json({ data: course, total: totalCourse });
  },
  getAllPayment: async function (req, res) {
    let size = req.body.size || 10;
    let pageNo = req.body.pageNo || 1;
    const query = {};
    query.skip = Number(size * (pageNo - 1));
    query.limit = Number(size) || 0;
    const sort = { _id: -1 };
    const totalPayment = await paymentModel.countDocuments({
      paymentStatus: "paid",
    });
    const payment = await paymentModel
      .find({ paymentStatus: "paid" })
      .populate({ path: "studentId", select: "firstName" })
      .populate({ path: "courseId", select: "coursetitle" })
      .sort(sort)
      .skip(query.skip)
      .limit(query.limit);
    res.status(200).json({ data: payment, total: totalPayment });
  },
  getAllOnlinePayment: async function (req, res) {
    let size = req.body.size || 10;
    let pageNo = req.body.pageNo || 1;
    const query = {};
    query.skip = Number(size * (pageNo - 1));
    query.limit = Number(size) || 0;
    const sort = { _id: -1 };

    let filter = {};
    if (req.body.searchText) {
      filter = {
        $or: [
          { name: { $regex: req.body.searchText, $options: "i" } },
          { email: { $regex: req.body.searchText, $options: "i" } },
        ],
      };
    }

    const totalPayment = await onlinepaymentModel.countDocuments(filter);
    const payment = await onlinepaymentModel
      .find(filter)
      .sort(sort)
      .skip(query.skip)
      .limit(query.limit);
    res.status(200).json({ data: payment, total: totalPayment });
  },
  exportInquiry: async function (req, res) {
    let data = [];
    let inquiry = await inquiryModel.find({});
    for (const ap of inquiry) {
      let val = {
        Name: ap.name ? ap.name : "-",
        Email: ap.email ? ap.email : "-",
        Contact: ap.contact ? ap.contact : "-",
        Message: ap.message ? ap.message : "-",
        Course: ap.course ? ap.course : "-",
        "Course Date": ap.courseDate ? ap.courseDate : "-",
        Type: ap.type == 1 ? "Course Form" : "Contact Form",
      };
      data.push(val);
    }
    const worksheet = XLSX.utils.json_to_sheet(data);

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "buffer",
    });

    res.set("Content-Disposition", "attachment; filename=inquiryExcel.xlsx");
    res.set(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.send(excelBuffer);
  },
  checkoutStripe: async function (req, res) {
    try {
      let result = await paymentService.checkoutStripe(req.body);
      res.status(200).json(result);
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  },

  checkoutStripeForLiveClasses: async function (req, res) {
    try {
      let result = await paymentService.checkoutStripeForLiveClasses(req.body);
      res.status(200).json(result);
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  },

  checkoutRazorpayForLiveClasses: async function (req, res) {
    try {
      let result = await paymentService.checkoutRazorpayForLiveClasses(
        req.body,
      );
      res.setHeader("Access-Control-Expose-Headers", "x-rtb-fingerprint-id");
      res.status(200).json(result);
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  },

  verifyRazorpayPaymentAndSendMail: async function (req, res) {
    try {
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        payDbId,
      } = req.body;
      const clientIp =
        req.headers["x-forwarded-for"] || req.connection?.remoteAddress || "";
      const userAgent = req.headers["user-agent"] || "";
      const data = await paymentService.verifyRazorpayPaymentOnlineSadhana({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        payDbId,
        clientIpReq: clientIp,
        userAgentReq: userAgent,
        reqBody: req.body,
      });
      res.status(200).json(data);
    } catch (err) {
      console.error(err);
      res.status(500).json("Internal Server Error");
    }
  },

  checkoutStripeWithoutProduct: async function (req, res) {
    let paymentData = {
      name: req.body.name,
      email: req.body.email,
      paymentStatus: "pending",
      price: req.body.price,
      currency: req.body.currency,
      paymentType: "stripe",
    };
    const pay = await onlinepaymentModel.create(paymentData);
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: req.body.currency,
            unit_amount: req.body.price * 100, // Amount in cents
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
      customer_email: req.body.email,
    });

    res
      .status(200)
      .json({ sessionId: session.id, payDbId: pay._id, url: session.url });
  },

  checkoutStripeForPranicPurification: async function (req, res) {
    try {
      let result = await paymentService.checkoutStripeForPranicPurification(
        req.body,
      );
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json(error);
    }
  },

  checkoutStripeForPranicPurificationII: async function (req, res) {
    try {
      let result = await paymentService.checkoutStripeForPranicPurificationII(
        req.body,
      );
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json(error);
    }
  },

  getPaymentResultPranicPurification: async function (req, res) {
    try {
      const returnData =
        await paymentService.getPaymentResultPranicPurification(req.body, req);
      res.status(returnData.status).json(returnData.data);
    } catch (error) {
      res.status(500).json("Internal server error");
    }
  },

  getPaymentResultPranicPurificationII: async function (req, res) {
    try {
      const returnData =
        await paymentService.getPaymentResultPranicPurificationII(req.body, req);
      res.status(returnData.status).json(returnData.data);
    } catch (error) {
      res.status(500).json("Internal server error");
    }
  },

  checkoutRazorpayForPranicPurification: async function (req, res) {
    try {
      let result = await paymentService.checkoutRazorpayForPranicPurification(
        req.body,
      );
      res.status(200).json(result);
    } catch (error) {
      console.error("Error in Razorpay checkout:", error);
      res.status(500).json({ error: "Payment initialization failed" });
    }
  },
  getRazorPaymentResultPranicPurification: async function (req, res) {
    try {
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        payDbId,
        password,
      } = req.body;
      let result = await paymentService.getRazorPaymentResultPranicPurification(
        {
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
          payDbId,
          password,
          req,
        },
      );
      res.status(200).json(result);
    } catch (error) {
      console.error("Error verifying Razorpay payment:", error);
      res.status(500).json("Internal server error");
    }
  },

  checkoutRazorpayForPranicPurificationII: async function (req, res) {
    try {
      let result = await paymentService.checkoutRazorpayForPranicPurificationII(
        req.body,
      );
      res.status(200).json(result);
    } catch (error) {
      console.error("Error in Razorpay checkout:", error);
      res.status(500).json({ error: "Payment initialization failed" });
    }
  },
  getRazorPaymentResultPranicPurificationII: async function (req, res) {
    try {
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        payDbId,
        password,
      } = req.body;
      let result = await paymentService.getRazorPaymentResultPranicPurificationII(
        {
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
          payDbId,
          password,
          req,
        },
      );
      res.status(200).json(result);
    } catch (error) {
      console.error("Error verifying Razorpay payment:", error);
      res.status(500).json("Internal server error");
    }
  },

  // checkoutStripeNewPranaarabha: async function (req, res) {
  //   try {
  //     let paymentData = {
  //       courseId: req.body.courseId,
  //       studentId: req.body.studentId,
  //       paymentStatus: req.body.paymentStatus,~~
  //       paymentBy: req.body.paymentBy,
  //     };
  //     const pay = await paymentModel.create(paymentData);
  //     const session = await stripe.checkout.sessions.create({
  //       payment_method_types: ["card"],
  //       line_items: [
  //         {
  //           price_data: {
  //             currency: req.body.currency,
  //             unit_amount: req.body.price * 100,
  //             product_data: {
  //               name: "PRANA ARAMBHA Yoga Course",
  //             },
  //           },
  //           quantity: 1,
  //         },
  //       ],
  //       mode: "payment",
  //       success_url: "https://pranaarambha.yogavidyaschool.com/success.html",
  //       cancel_url: "https://pranaarambha.yogavidyaschool.com/failed.html",
  //       customer_email: req.body.email,
  //     });
  //     res
  //       .status(200)
  //       .json({ sessionId: session.id, payDbId: pay._id, url: session.url });
  //   } catch (err) {
  //     res.status(500).send("Internal Server Error");
  //   }
  // },

  checkoutRazorpayNewPranaarabha: async function (req, res) {
    try {
      let result = await paymentService.checkoutRazorpayNewPranaarabha(
        req.body,
      );
      res.setHeader("Access-Control-Expose-Headers", "x-rtb-fingerprint-id");
      res.status(200).json(result);
    } catch (err) {
      console.error(err);
      res.status(500).send("Internal Server Error");
    }
  },
  getPaymentResult: async function (req, res) {
    try {
      const session = await stripe.checkout.sessions.retrieve(
        req.body.sessionId,
      );
      if (session.payment_status == "paid") {
        let val = {
          student: req.body.student,
          course: req.body.course,
          price: `${session.amount_total / 100} ${session.currency}`,
          paymentId: session.payment_intent,
          amount: session.amount_total / 100,
          currency: session.currency,
          paymentStatus: "paid",
          payDbId: req.body.dbPay,
          date: req.body.date,
        };
        try {
          try {
            const pay = await paymentModel.findOneAndUpdate(
              { _id: val.payDbId },
              {
                paymentId: val.paymentId,
                amount: val.amount,
                currency: val.currency,
                paymentStatus: val.paymentStatus,
              },
            );
            await paymentRepo.disableCouponCode(req.body.couponCode);
          } catch (e) {
            console.log("paymnet update error");
          }
          try {
            let student = await studentModel.findOne({ _id: val.student });
            let coursebody = [];
            if (val.course) {
              if (student.course.length > 0) {
                coursebody = [...student.course, val.course];
              } else {
                coursebody = [val.course];
              }
            }
            let uniqueArray = coursebody.filter((value, index, self) => {
              return self.indexOf(value) === index;
            });

            let bodyUp = {
              course: uniqueArray,
            };
            let up = await studentModel.findOneAndUpdate(
              { _id: val.student },
              bodyUp,
            );
          } catch (e) {
            console.log("student course update failed");
          }

          try {
            const { coursetitle } = await courseModel.findOne({
              _id: val.course,
            });
            const { firstName, email, password } = await studentModel.findOne({
              _id: val.student,
            });
            let mailOptions;
            let wpLink = "https://chat.whatsapp.com/HGbJ7GrmClK4QTf4P77MXA";
            if (val.course == constants.COURSE.FOUNDATION_SPIRITUALITY) {
              await helper.completeFoundationOfSpiritualityMail({
                firstName,
                email,
                password,
              });
            } else {
              const replacements = {
                name: firstName,
                course: coursetitle,
                email: email,
                price: val.price,
                date: val.date,
                password: password,
              };
              await helper.sendPranaArambhEmail(replacements);
            }
          } catch (e) {
            console.log("email send error!");
          }
        } catch (err) {
          console.log("internal error");
        }
        res.status(200).json({
          status: "success",
          sessionId: req.body.sessionId,
          paymtId: session.payment_intent,
          amount: session.amount_total / 100,
          currency: session.currency,
        });
      } else {
        res
          .status(200)
          .json({ status: "failed", sessionId: req.body.sessionId });
      }
    } catch (error) {
      res.status(500).json("Internal server error");
    }
  },

  getRazorpayPaymentResultForPranarambha: async function (req, res) {
    try {
      const {
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature,
        student,
        course,
        payDbId,
        amount,
        currency,
        couponCodeId,
      } = req.body;
      const returnData =
        await paymentService.getRazorpayPaymentResultForPranarambha(
          razorpay_payment_id,
          razorpay_order_id,
          razorpay_signature,
          student,
          course,
          payDbId,
          amount,
          currency,
          couponCodeId,
        );
      res.status(returnData.status).json(returnData.result);
    } catch (error) {
      console.error("Payment result error:", error);
      res.status(500).json("Internal server error");
    }
  },
  getPaymentResultAndSendMailForLiveClass: async function (req, res) {
    try {
      const clientIp =
        req.headers["x-forwarded-for"] || req.connection?.remoteAddress || "";
      const userAgent = req.headers["user-agent"] || "";
      let data = await paymentService.verifyStripePaymentOnlineSadhana(
        req.body,
        clientIp,
        userAgent,
      );
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json("Internal server error");
    }
  },
  getPaymentResultV2: async function (req, res) {
    try {
      const session = await stripe.checkout.sessions.retrieve(
        req.body.sessionId,
      );
      if (session.payment_status == "paid") {
        let val = {
          paymentStatus: "paid",
          payDbId: req.body.dbPay,
        };

        try {
          updatePaymentV2(val);
          res.status(200).json({
            status: "success",
            sessionId: req.body.sessionId,
            paymtId: session.payment_intent,
            amount: session.amount_total / 100,
            currency: session.currency,
          });
        } catch (err) {
          console.log("internal error");
        }
      } else {
        res
          .status(200)
          .json({ status: "failed", sessionId: req.body.sessionId });
      }
    } catch (error) {
      res.status(500).json("Internal server error");
    }
  },
  createOnlineVideo: async function (req, res) {
    {
      try {
        if (req.body._id) {
          const onlineVideo = await onlineVideoModel.findOneAndUpdate(
            { _id: req.body._id },
            req.body,
          );
          res
            .status(200)
            .json({ status: "ok", msg: `video updated Successfully` });
        } else {
          const onlineVideo = await onlineVideoModel.create(req.body);
          res.status(201).json({ status: "ok", msg: "video Upload Success" });
        }
      } catch (err) {
        res.status(400).json({ err });
      }
    }
  },
  getCourseVideoDataById: async function (req, res) {
    try {
      const { id: cId } = req.params;

      const courseVideo = await onlineVideoModel.findOne({ _id: cId });

      if (!courseVideo) {
        return res.status(404).json({ msg: `No Video with Id ${cId}` });
      }
      res.status(200).json({ data: courseVideo });
    } catch (err) {
      res.status(500).json({ msg: err });
    }
  },
  getEventsById: async function (req, res) {
    try {
      const { id: eveId } = req.params;

      const event = await eventModel.findOne({ _id: eveId });

      if (!event) {
        return res.status(404).json({ msg: `No Event with Id ${eveId}` });
      }
      res.status(200).json({ data: event });
    } catch (err) {
      res.status(500).json({ msg: err });
    }
  },
  createAnalytics: async function (req, res) {
    {
      try {
        // if(req.body._id){
        //     const analytics = await analyticsModel.findOneAndUpdate({_id:req.body._id},req.body);
        //     res.status(200).json({status:"ok",msg:`video updated Successfully`});
        // }else{
        //     const analytics = await analyticsModel.create(req.body);
        //     res.status(201).json({status:"ok", msg:"video Upload Success"});
        // }
        const getAnalytics = await analyticsModel.countDocuments({
          videoId: req.body.videoId,
          studentId: req.body.studentId,
        });
        if (getAnalytics > 0) {
          res.status(200).json({ status: "ok" });
        } else {
          const analytics = await analyticsModel.create(req.body);
          res.status(201).json({ status: "ok" });
        }
      } catch (err) {
        res.status(400).json({ err });
      }
    }
  },
  getAnalyticsByDate: async function (req, res) {
    let initialValue = 0;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    // console.log(sevenDaysAgo,thirtyDaysAgo,ninetyDaysAgo,oneYearAgo);

    if (req.body.days == 7) {
      const inrRevenue = await paymentModel.find({
        currency: "inr",
        created: { $lt: sevenDaysAgo },
      });
      const usdRevenue = await paymentModel.find({
        currency: "usd",
        created: { $lt: sevenDaysAgo },
      });
      const totalSignup = await studentModel.countDocuments({
        created: { $lt: sevenDaysAgo },
      });

      const inrSum = inrRevenue.reduce(function (accumulator, curValue) {
        return accumulator + Number(curValue.amount);
      }, initialValue);
      const usdSum = usdRevenue.reduce(function (accumulator, curValue) {
        return accumulator + Number(curValue.amount);
      }, initialValue);

      res
        .status(200)
        .json({ rInr: inrSum, rUsd: usdSum, tStudent: totalSignup });
    } else if (req.body.days == 30) {
      const inrRevenue = await paymentModel.find({
        currency: "inr",
        created: { $lt: thirtyDaysAgo },
      });
      const usdRevenue = await paymentModel.find({
        currency: "usd",
        created: { $lt: thirtyDaysAgo },
      });
      const totalSignup = await studentModel.countDocuments({
        created: { $lt: thirtyDaysAgo },
      });

      const inrSum = inrRevenue.reduce(function (accumulator, curValue) {
        return accumulator + Number(curValue.amount);
      }, initialValue);
      const usdSum = usdRevenue.reduce(function (accumulator, curValue) {
        return accumulator + Number(curValue.amount);
      }, initialValue);

      res
        .status(200)
        .json({ rInr: inrSum, rUsd: usdSum, tStudent: totalSignup });
    } else if (req.body.days == 90) {
      const inrRevenue = await paymentModel.find({
        currency: "inr",
        created: { $lt: ninetyDaysAgo },
      });
      const usdRevenue = await paymentModel.find({
        currency: "usd",
        created: { $lt: ninetyDaysAgo },
      });
      const totalSignup = await studentModel.countDocuments({
        created: { $lt: ninetyDaysAgo },
      });

      const inrSum = inrRevenue.reduce(function (accumulator, curValue) {
        return accumulator + Number(curValue.amount);
      }, initialValue);
      const usdSum = usdRevenue.reduce(function (accumulator, curValue) {
        return accumulator + Number(curValue.amount);
      }, initialValue);

      res
        .status(200)
        .json({ rInr: inrSum, rUsd: usdSum, tStudent: totalSignup });
    } else if (req.body.days == 1) {
      const inrRevenue = await paymentModel.find({
        currency: "inr",
        created: { $lt: oneYearAgo },
      });
      const usdRevenue = await paymentModel.find({
        currency: "usd",
        created: { $lt: oneYearAgo },
      });
      const totalSignup = await studentModel.countDocuments({
        created: { $lt: oneYearAgo },
      });

      const inrSum = inrRevenue.reduce(function (accumulator, curValue) {
        return accumulator + Number(curValue.amount);
      }, initialValue);
      const usdSum = usdRevenue.reduce(function (accumulator, curValue) {
        return accumulator + Number(curValue.amount);
      }, initialValue);

      res
        .status(200)
        .json({ rInr: inrSum, rUsd: usdSum, tStudent: totalSignup });
    } else {
      res.json({ msg: "Internal Server error" });
    }
  },
  createSubscriber: async function (req, res) {
    {
      try {
        let subs = await subscribeModel.findOne({
          email: req.body.email,
        });

        if (!subs) {
          subs = await subscribeModel.create(req.body);
        } else {
          if (req.body.name) {
            subs.name = req.body.name;
          }
        }

        try {
          await createContent({
            contentPath: constants.EMAIL_TEMPLATE.SUBSCRIBER_EMAIL_1,
            mailTo: req.body.email,
            subject: "Welcome to Yoga Vidya – The Journey Within Begins",
            replacements: {
              NAME: subs.name,
            },
          });

          subs.emailStage = 2;
          subs.nextEmailDate = new Date(Date.now() + 48 * 60 * 60 * 1000);
          await subs.save();
          res.status(200).json({
            status: "ok",
            msg: `Subscriber Inserted Success & Email Sent`,
          });
        } catch (emailErr) {
          console.error(emailErr);
          res.status(200).json({
            status: "ok",
            msg: `Subscriber Inserted Success but Email Failed`,
          });
        }
      } catch (err) {
        console.log(err);
        res.status(400).json({ msg: "Internal Server error" });
      }
    }
  },
  getCouponCode: async function (req, res) {
    {
      try {
        const result = await paymentService.getCouponCode(req.body);
        res.status(200).json(result);
      } catch (err) {
        res.status(400).json(err);
      }
    }
  },
  disableCouponCode: async function (req, res) {
    {
      try {
        const result = await paymentService.disableCouponCode(req.body);
        res.status(200).json(result);
      } catch (err) {
        res.status(400).json(err);
      }
    }
  },
  checkoutRazorpayFor200TTC: async function (req, res) {
    {
      try {
        const result = await paymentService.checkoutRazorpayFor200TTC(req.body);
        res.status(200).json(result);
      } catch (err) {
        res.status(400).json(err);
      }
    }
  },
  getRazorPaymentResult200TTC: async function (req, res) {
    try {
      result = await paymentService.getRazorPaymentResult200TTC(req.body, req);
      res.status(200).json(result);
    } catch (error) {
      console.error("Error verifying Razorpay payment:", error);
      res.status(500).json("Internal server error");
    }
  },
  checkoutStripeFor200TTC: async function (req, res) {
    try {
      let result = await paymentService.checkoutStripeFor200TTC(req.body);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json(error);
    }
  },
  getStripePaymentResult200TTC: async function (req, res) {
    try {
      const returnData = await paymentService.getStripePaymentResult200TTC(
        req.body,
        req,
      );
      res.status(returnData.status).json(returnData.data);
    } catch (error) {
      res.status(500).json("Internal server error");
    }
  },
  createLiveCourseCustomer: async function (req, res) {
    {
      try {
        const returnData = await adminService.createLiveCourseCustomer(
          req.body,
        );
        res.status(returnData.status).json(returnData.data);
      } catch (err) {
        res.status(400).json({ err });
      }
    }
  },

  createFreeWebinarCustomer: async function (req, res) {
    {
      try {
        const returnData = await adminService.createFreeWebinarCustomer(
          req.body,
        );
        res.status(returnData.status).json(returnData.data);
      } catch (err) {
        res.status(400).json({ err });
      }
    }
  },

  createRishikeshCustomer: async function (req, res) {
    {
      try {
        const returnData = await adminService.createRishikeshCustomer(req.body);
        res.status(returnData.status).json(returnData.data);
      } catch (err) {
        res.status(400).json({ err });
      }
    }
  },
  createPranaArambhCustomer: async function (req, res) {
    {
      try {
        const returnData = await adminService.createPranaArambhCustomer(
          req.body,
        );
        res.status(returnData.status).json(returnData.data);
      } catch (err) {
        res.status(400).json({ err });
      }
    }
  },
  sendBulkMailFreeWebiner: async function (req, res) {
    {
      try {
        const returnData = await adminService.sendBulkMailFreeWebiner();
        res.status(returnData.status).json(returnData.data);
      } catch (err) {
        res.status(400).json({ err });
      }
    }
  },
  getAllParayanamStudent: async function (req, res) {
    try {
      const result = await adminService.getAllParayanamStudent(req.body);
      res
        .status(200)
        .json({ data: result.studentList, total: result.totalStudent });
    } catch (err) {
      res.status(500).json({ error: err });
    }
  },
  getAllPendingPaymentList: async function (req, res) {
    {
      try {
        const returnData = await adminService.getAllPendingPaymentList(
          req.body,
        );
        res.status(200).json({
          status: true,
          data: returnData,
        });
      } catch (err) {
        res.status(400).json({ err });
      }
    }
  },
  sendBulkMail200TTC: async function (req, res) {
    {
      try {
        const returnData = await adminService.sendBulkMail200TTC();
        res.status(returnData.status).json(returnData.data);
      } catch (err) {
        res.status(400).json({ err });
      }
    }
  },
  giveAccessToUser: async function (req, res) {
    {
      try {
        const returnData = await adminService.giveAccessToUser(req.body);
        res.status(returnData.status).json(returnData.data);
      } catch (err) {
        res.status(400).json({ err });
      }
    }
  },
  uploadCourseVideo: async function (req, res) {
    {
      try {
        if (!req.file) {
          return res.status(400).json({
            success: false,
            error: "No video file provided",
          });
        }
        const returnData = await courseService.uploadCourseVideo(
          req.file,
          req.body,
        );
        res.status(200).json(returnData);
      } catch (err) {
        res.status(400).json({ err });
      }
    }
  },
  foundationOfSpiritualitySave: async function (req, res) {
    {
      try {
        const returnData = await adminService.foundationOfSpiritualitySave(
          req.body,
        );
        res.status(returnData.status).json(returnData.data);
      } catch (err) {
        res.status(400).json({ err });
      }
    }
  },
  getAllLiveClassTeacher: async function (req, res) {
    {
      try {
        const returnData = await adminService.getAllLiveClassTeacher();
        res.status(returnData.status).json(returnData.data);
      } catch (err) {
        res.status(400).json({ err });
      }
    }
  },
  createBaliCustomer: async function (req, res) {
    {
      try {
        const returnData = await adminService.createBaliCustomer(req.body);
        res.status(returnData.status).json(returnData.data);
      } catch (err) {
        res.status(400).json({ err });
      }
    }
  },
  sendMailToSubscribersForcefully: async function (req, res) {
    try {
      const emailSubject =
        req.body.emailSubject?.trim() ||
        "A Gentle Return to Practice – New Batch Starts April 6";
      const limit = parseInt(req.body.limit) || 500;

      const result = await subscriberService.sendBulkEmailToSubscribers(
        emailSubject,
        limit,
      );

      res.status(200).json(result);
    } catch (err) {
      console.error("Error in sendMailToSubscribersForcefully:", err);
      res.status(500).json({
        status: "error",
        message: "Internal server error",
        error: err.message,
      });
    }
  },
  sendPranicGuidanceWebinarForcefully: async function (req, res) {
    try {
      const users = await pranicPurificationUsersModel.find({
        paymentStatus: "paid"
      });
      console.log(
        `Found ${users.length} students to send Pranic Guidance Webinar email`,
      );

      // Respond immediately before starting the long-running email process
      res.status(200).json({
        success: true,
        totalUsers: users.length,
        message: `Emails are being sent to ${users.length} users in the background to ensure all are delivered safely.`,
      });

      // Run email sending in background
      (async () => {
        let successCount = 0;
        let failedCount = 0;
        const MAX_RETRIES = 3;
        const DELAY_BETWEEN_EMAILS = 5000; // 5 second delay avoids SMTP rate-limiting

        for (let i = 0; i < users.length; i++) {
          const user = users[i];
          const mailData = {
            replacements: {},
            mailTo: user.email,
            contentPath: constants.EMAIL_TEMPLATE.PRANIC_GUIDANCE_WEBINAR,
            subject: "REPLAY: Access the Pranic Guidance Workshop Recording",
          };

          let attempts = 0;
          let success = false;

          while (attempts < MAX_RETRIES && !success) {
            try {
              await createContent(mailData);
              success = true;
              successCount++;
              console.log(
                `[${i + 1}/${users.length}] ✓ Email sent successfully to ${user.name} (${user.email})`,
              );
            } catch (emailError) {
              attempts++;
              console.error(
                `[${i + 1}/${users.length}] ✗ Attempt ${attempts} failed for ${user.email} - Retrying...`,
              );
              if (attempts < MAX_RETRIES) {
                await new Promise((r) => setTimeout(r, 2000)); // delay before retry
              }
            }
          }

          if (!success) {
            failedCount++;
            console.error(
              `[${i + 1}/${users.length}] ❌ Final failure for ${user.email} after ${MAX_RETRIES} attempts.`,
            );
          }

          // Small delay before next user
          if (i < users.length - 1) {
            await new Promise((r) => setTimeout(r, DELAY_BETWEEN_EMAILS));
          }
        }

        console.log(
          `✅ Bulk email process finished. Success: ${successCount}, Failed: ${failedCount}`,
        );
      })();
    } catch (err) {
      console.error("Error in sendPranicGuidanceWebinarForcefully:", err);
      if (!res.headersSent) {
        res.status(500).json({
          status: "error",
          message: "Internal server error",
          error: err.message,
        });
      }
    }
  },
};

let updatePaymentV2 = async function (data) {
  try {
    const pay = await onlinepaymentModel.findOneAndUpdate(
      { _id: data.payDbId },
      { paymentId: data.paymentId, paymentStatus: data.paymentStatus },
    );
  } catch (error) {
    res.staus(500).json("Internal server error");
  }
};

let updatePaymentOnlineLiveClasses = async function (data) {
  try {
    const pay = await liveCoursesCustomermodel.findOneAndUpdate(
      { _id: data.payDbId },
      { paymentId: data.paymentId, paymentStatus: data.paymentStatus },
    );
  } catch (error) {
    res.staus(500).json("Internal server error");
  }
};
