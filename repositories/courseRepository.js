"use strict";
const courseModel = require("../models/courseModel");
const mongoose = require("mongoose");
const timeSlots = require("../models/TimeSlots");
const freeWebinarModel = require("../models/freeWebinarModel");
function getCourseBySlug(slug) {
  return new Promise(async (resolve, reject) => {
    try {
      const course = await courseModel.findOne({ slug: slug });
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
module.exports = { getCourseBySlug, getCourseById, checkCourseTimeSlot, createFreeWebinarCustomer };
