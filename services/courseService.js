"use strict";
const courseRepo = require("../repositories/courseRepository");
const constants = require("../helpers/constants.json");
const s3Service = require("./s3_bucket");
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
function uploadCourseVideo(reqFile, reqody) {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await s3Service.uploadVideoToS3(
        reqFile.buffer,
        reqFile.originalname,
        constants.COURSE.TWO_THOUSANDS_TTC,
        reqFile.mimetype
      );
      const lastUploadedVideo = await courseRepo.getLastCourseVideo(
        constants.COURSE.TWO_THOUSANDS_TTC
      );
      // await courseRepo.uploadCourseVideo({
      //   courseId: constants.COURSE.TWO_THOUSANDS_TTC,
      //   title: reqody.courseName,
      //   sortBy: +lastUploadedVideo.sortBy + 1,
      //   videoName: result.fileName.split(".")[0],
      // });
      return resolve({
        success: true,
        message: "Video uploaded successfully",
      });
    } catch (error) {
      reject(error);
    }
  });
}
module.exports = {
  getCourseBySlug,
  changeCourseStatusToOngoing,
  uploadCourseVideo,
};
