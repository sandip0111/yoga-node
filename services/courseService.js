"use strict";
const courseRepo = require("../repositories/courseRepository");
const constants = require("../helpers/constants.json");
function getCourseBySlug(slug) {
  return new Promise(async (resolve, reject) => {
    try {
      const course = await courseRepo.getCourseBySlug(slug);
      if (!course) {
        return resolve({
          data: { msg: `No course with Id ${slug}` },
          status: 404,
        });
      }
      return resolve({ data: { data: [course] }, status: 200 });
    } catch (error) {
      reject(error);
    }
  });
}
function changeCourseStatusToOngoing() {
  return new Promise(async (resolve, reject) => {
    try {
      let studentData = await courseRepo.getWithoutPaymentCourseStudent();
      for (let obj of studentData) {
        await courseRepo.addPaymentCourseStudent(obj);
      }
      return resolve(1);
    } catch (error) {
      reject(error);
    }
  });
}
module.exports = { getCourseBySlug, changeCourseStatusToOngoing };
