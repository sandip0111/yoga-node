"use strict";
const studentRepo = require("../repositories/studentRepository");
const courseRepo = require("../repositories/courseRepository");
const helper = require("../helpers/helper");
const constant = require("../helpers/constants.json");
const liveCoursesCustomermodel = require("../models/liveCoursesCustomerModel");
function registerSwarSadhanaWebinarUser(reqBody) {
  return new Promise(async (resolve, reject) => {
    try {
      var {
        name,
        email,
        phone,
        city,
        company,
        webinar,
        timeSlot,
        password,
        isWebsite,
        paymentType,
      } = reqBody;
      let created = new Date();
      if (timeSlot) {
        const errMsg = await courseRepo.checkCourseTimeSlot(timeSlot);
        if (errMsg) {
          return resolve({
            data: { error: errMsg },
            status: 400,
          });
        }
      }
      var paymentStatus = "";
      if (isWebsite) {
        paymentStatus = constant.PAYMENT_STATUS.PENDING;
      } else {
        paymentType = "paypal";
        paymentStatus = constant.PAYMENT_STATUS.PAID;
        isWebsite = false;
      }

      const savedUser = await studentRepo.registerSwaraSadhanaStudentByAdmin({
        name,
        email,
        phone,
        city,
        company,
        webinar,
        timeSlot,
        password,
        created,
        paymentStatus,
        paymentType,
      });
      if (!isWebsite) {
        await helper.sendSwaraSadhnaEmail(
          {
            name: name,
            webinar: webinar,
            email: email,
            password: password,
          },
          email
        );
      }
      return resolve({
        data: {
          status: "ok",
          message: "User registered successfully!",
          userId: savedUser._id,
        },
        status: 200,
      });
    } catch (error) {
      reject(error);
    }
  });
}
function registerPranicPurificationUser(reqBody) {
  return new Promise(async (resolve, reject) => {
    try {
      const savedUser =
        await studentRepo.registerPranicPurificationStudentByAdmin({
          name: reqBody.name,
          email: reqBody.email,
          phoneNumber: reqBody.phone,
          address: reqBody.address,
          paymentStatus: constant.PAYMENT_STATUS.PAID,
          created: new Date(),
        });
      await helper.sendPranicEmail(savedUser);
      return resolve({
        data: {
          status: "ok",
          message: "User registered successfully!",
          userId: savedUser._id,
        },
        status: 200,
      });
    } catch (error) {
      reject(error);
    }
  });
}
function register200TTCUser(reqBody) {
  return new Promise(async (resolve, reject) => {
    try {
      const savedUser = await studentRepo.register200TTCStudentByAdmin({
        name: reqBody.name,
        email: reqBody.email,
        phoneNumber: reqBody.phone,
        paymentStatus: constant.PAYMENT_STATUS.PAID,
        created: new Date(),
        paymentType: "paypal",
      });
      await helper.send200TTCEmail(savedUser);
      return resolve({
        data: {
          status: "ok",
          message: "User registered successfully!",
          userId: savedUser._id,
        },
        status: 200,
      });
    } catch (error) {
      reject(error);
    }
  });
}
function createLiveCourseCustomer(reqBody, mentors) {
  return new Promise(async (resolve, reject) => {
    try {
      const paymentData = {
        name: reqBody.name,
        email: reqBody.email,
        phone: reqBody.phone,
        paymentStatus: "paid",
        courses: reqBody.course,
        paymentType: "paypal",
      };
      await liveCoursesCustomermodel.create(paymentData);
      for (let coursObj of reqBody.courseList) {
        var item = mentors.find((obj) => coursObj.includes(obj.name));
        if (item) {
          await helper.sendLiveCourseEmail(
            {
              name: reqBody.name,
            },
            reqBody.email,
            `/emailTemplate/${item.emailTemplate}`,
            item.subject
          );
        }
      }
      return resolve({
        data: {
          status: "ok",
          message: "User registered successfully!",
        },
        status: 200,
      });
    } catch (error) {
      reject(error);
    }
  });
}
module.exports = {
  registerSwarSadhanaWebinarUser,
  registerPranicPurificationUser,
  register200TTCUser,
  createLiveCourseCustomer,
};
