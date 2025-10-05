"use strict";
const studentRepo = require("../repositories/studentRepository");
const courseRepo = require("../repositories/courseRepository");
const helper = require("../helpers/helper");
const constant = require("../helpers/constants.json");
function registerSwarSadhanaWebinarUser(reqBody) {
  return new Promise(async (resolve, reject) => {
    try {
      const { name, email, phone, city, company, webinar, timeSlot, password } =
        reqBody;
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
      });
     // await helper.sendWebinerEmail(savedUser);
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
      const savedUser =
        await studentRepo.register200TTCStudentByAdmin({
          name: reqBody.name,
          email: reqBody.email,
          phoneNumber: reqBody.phone,
          paymentStatus: constant.PAYMENT_STATUS.PAID,
          created: new Date(),
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
module.exports = {
  registerSwarSadhanaWebinarUser,
  registerPranicPurificationUser,
  register200TTCUser
};
