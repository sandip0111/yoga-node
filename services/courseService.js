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
function uploadCourseVideo(reqFile, reqBody) {
  return new Promise(async (resolve, reject) => {
    try {
      const fs = require("fs");
      const fileStream = fs.createReadStream(reqFile.path);

      const result = await s3Service.uploadVideoToS3(
        fileStream,
        reqFile.originalname,
        reqBody.selectedCourse,
        reqFile.mimetype,
        reqFile.size
      );

      // Remove temp file from disk after uploading to S3
      fs.unlink(reqFile.path, (err) => {
        if (err) console.error("Error deleting temp video file:", err);
      });

      const lastUploadedVideo = await courseRepo.getLastCourseVideo(
        reqBody.selectedCourse,
      );
      let newData;
      if (reqBody.selectedCourse == constants.COURSE.ONLINE_LIVE_CLASSES) {
        newData = {
          courseId: reqBody.selectedCourse,
          title: reqBody.courseName,
          sortBy: lastUploadedVideo ? +lastUploadedVideo.sortBy + 1 : 1,
          videoName: result.fileName.split(".")[0],
          month: reqBody.month,
          teacherId: +reqBody.teacherId,
        };
      } else {
        newData = {
          courseId: reqBody.selectedCourse,
          title: reqBody.courseName,
          sortBy: lastUploadedVideo ? +lastUploadedVideo.sortBy + 1 : 1,
          videoName: result.fileName.split(".")[0],
          month: reqBody.month,
        };
      }
      await courseRepo.uploadCourseVideo(newData);
      return resolve({
        success: true,
        message: "Video uploaded successfully",
      });
    } catch (error) {
      reject(error);
    }
  });
}
function deleteCourseVideo(id) {
  return new Promise(async (resolve, reject) => {
    try {
      const video = await courseRepo.getCourseVideoById(id);
      if (!video) {
        return resolve({
          success: false,
          status: 404,
          message: "Video not found",
        });
      }

      try {
        await s3Service.deleteVideoFromS3(video.courseId, video.videoName);
      } catch (s3Error) {
        console.error("Error deleting video from S3:", s3Error);
      }

      await courseRepo.deleteCourseVideoById(id);

      return resolve({
        success: true,
        status: 200,
        message: "Video deleted successfully",
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
  deleteCourseVideo,
};

