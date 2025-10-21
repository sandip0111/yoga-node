"use strict";
const studentRepo = require("../repositories/studentRepository");
const courseRepo = require("../repositories/courseRepository");
const helper = require("../helpers/helper");
const constant = require("../helpers/constants.json");
const liveCoursesCustomermodel = require("../models/liveCoursesCustomerModel");
const paymentRepo = require("../repositories/paymentRepository");
const paymentModel = require("../models/paymentModel");
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

function createFreeWebinarCustomer(reqBody) {
  return new Promise(async (resolve, reject) => {
    try {
      const customerData = {
        name: reqBody.name,
        email: reqBody.email,
        webinarDate: reqBody.webinarDate
      };
      await courseRepo.createFreeWebinarCustomer(customerData);
      const savedUser ={
        name: reqBody.name,
        email: reqBody.email,
        subject: "Your spot is confirmed – “Sadhana to Seva” Webinar Access Inside"
      }
      await helper.sendFreeWebinarConfirmationEmail(savedUser);
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

function createRishikeshCustomer(reqBody) {
  return new Promise(async (resolve, reject) => {
    try {
      const paymentData = {
        name: reqBody.name,
        email: reqBody.email,
        phone: reqBody.phone,
        hour: reqBody.hour,
        paymentStatus: "paid",
        paymentType: "paypal",
      };
      await paymentRepo.createRishikeshData(paymentData);
      await helper.sendRishikeshCourseEmail(reqBody);
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
function createPranaArambhCustomer(reqBody) {
  return new Promise(async (resolve, reject) => {
    try {
      const student = await studentRepo.createStudent({
        firstName: reqBody.name,
        email: reqBody.email,
        password: reqBody.password,
        course: ["644f9dfc499ffcfb45df35cd"],
      });
      const paymentData = {
        courseId: "644f9dfc499ffcfb45df35cd",
        studentId: student._id,
        paymentStatus: "paid",
        paymentBy: "Paypal",
      };
      await paymentModel.create(paymentData);
      let coursetitle = await courseRepo.getCourseById(
        "644f9dfc499ffcfb45df35cd"
      );
      let date = new Date();
      let replacement = {
        name: reqBody.name,
        course: coursetitle,
        email: reqBody.email,
        date: date.toString(),
        password: reqBody.password,
      };
      await helper.sendPranaArambhEmail(replacement);
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
  createRishikeshCustomer,
  createPranaArambhCustomer,
  createFreeWebinarCustomer,
};
