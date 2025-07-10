"use strict";
const courseModel = require("../models/courseModel");
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
module.exports = { getCourseBySlug, getCourseById };
