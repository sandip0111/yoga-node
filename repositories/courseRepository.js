"use strict";
const courseModel = require("../models/courseModel");
const mongoose = require("mongoose");
const timeSlots = require("../models/TimeSlots");
const freeWebinarModel = require("../models/freeWebinarModel");
const studentModel = require("../models/StudentModel");
const paymentModel = require("../models/paymentModel");
const onlinevideosModel = require("../models/onlineVideoModel");
const constant = require("../helpers/constants.json");
function getCourseBySlug(slug) {
  return new Promise(async (resolve, reject) => {
    try {
      const course = await courseModel.findOne({ slug: slug }).lean();
      return resolve(course);
    } catch (error) {
      reject(error);
    }
  });
}
function getCourseById(id) {
  return new Promise(async (resolve, reject) => {
    try {
      const data = await courseModel.findOne({ _id: id });
      return resolve(data.coursetitle);
    } catch (error) {
      return reject(error);
    }
  });
}
function checkCourseTimeSlot(timeSlot) {
  return new Promise(async (resolve, reject) => {
    try {
      let data = null;
      if (!mongoose.Types.ObjectId.isValid(timeSlot)) {
        data = "Invalid timeSlot ID format.";
      }
      const existingSlot = await timeSlots.findById(timeSlot);
      if (!existingSlot) {
        data = "Invalid timeSlot ID. Time slot does not exist.";
      }
      return resolve(data);
    } catch (error) {
      return reject(error);
    }
  });
}

function createFreeWebinarCustomer(reqBody) {
  return new Promise(async (resolve, reject) => {
    try {
      const course = await freeWebinarModel.create(reqBody);
      return resolve(course);
    } catch (error) {
      reject(error);
    }
  });
}

function getFreeWebinarCustomer(data) {
  return new Promise(async (resolve, reject) => {
    try {
      const course = await freeWebinarModel.find(data);
      return resolve(course);
    } catch (error) {
      reject(error);
    }
  });
}

function updateFreeWebinarCustomer(id, data) {
  return new Promise(async (resolve, reject) => {
    try {
      const course = await freeWebinarModel.findOneAndUpdate({ _id: id }, data);
      return resolve(course);
    } catch (error) {
      reject(error);
    }
  });
}

function getWithoutPaymentCourseStudent() {
  return new Promise(async (resolve, reject) => {
    try {
      const course = await studentModel
        .find({
          $or: [
            { paymentCourseId: { $exists: false } },
            { paymentCourseId: null },
          ],
        })
        .lean();
      return resolve(course);
    } catch (error) {
      reject(error);
    }
  });
}

function addPaymentCourseStudent(obj) {
  return new Promise(async (resolve, reject) => {
    try {
      const paymentObj = await paymentModel.findOne({ studentId: obj._id });
      if (paymentObj) {
        await studentModel.updateOne(
          { _id: obj._id },
          { paymentCourseId: paymentObj.courseId }
        );
      }
      return resolve(1);
    } catch (error) {
      reject(error);
    }
  });
}

function uploadCourseVideo(obj) {
  return new Promise(async (resolve, reject) => {
    try {
      const paymentObj = await onlinevideosModel.create(obj);
      return resolve(paymentObj);
    } catch (error) {
      reject(error);
    }
  });
}

function getLastCourseVideo(courseId) {
  return new Promise(async (resolve, reject) => {
    try {
      const courseVideo = await onlinevideosModel
        .findOne({
          courseId: courseId,
        })
        .sort({ created: -1 });
      return resolve(courseVideo);
    } catch (error) {
      reject(error);
    }
  });
}

function getAllLiveClassTeacher() {
  return new Promise(async (resolve, reject) => {
    try {
      const courseVideo = await courseModel
        .findOne(
          {
            _id: constant.COURSE.ONLINE_LIVE_CLASSES,
          },
          { "teachersData.name": 1, "teachersData.id": 1 }
        )
        .sort({ created: -1 });
      return resolve(courseVideo);
    } catch (error) {
      reject(error);
    }
  });
}

function getFilteredFreeWebinarCustomers(emailSubject, limit = 500) {
  return new Promise(async (resolve, reject) => {
    try {
      const customers = await freeWebinarModel
        .find({})
        .select("_id name email")
        .limit(limit);

      return resolve(customers);
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  getCourseBySlug,
  getCourseById,
  checkCourseTimeSlot,
  createFreeWebinarCustomer,
  getFreeWebinarCustomer,
  updateFreeWebinarCustomer,
  getWithoutPaymentCourseStudent,
  addPaymentCourseStudent,
  uploadCourseVideo,
  getLastCourseVideo,
  getAllLiveClassTeacher,
  getFilteredFreeWebinarCustomers
};
