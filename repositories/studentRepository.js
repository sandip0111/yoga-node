"use strict";
const studentModel = require("../models/StudentModel");
const paymentModel = require("../models/paymentModel");
const liveCoursesCustomerModel = require("../models/liveCoursesCustomerModel");
const webinarRegisterUser = require("../models/webinarRegiserUserModel");
const mongoose = require("mongoose");
const pranicPurificationModel = require("../models/pranicPurificationUsersModel");
const twoHundredHourTTCModel = require("../models/twoHundredHourTTCModel");
const onlineVideoModel = require("../models/onlineVideoModel");
const webinarUser = require("../models/webinarRegiserUserModel");
const freeWebinarModel = require("../models/freeWebinarModel");

module.exports = {
  getStudentCountFilter: function (pipeline) {
    return new Promise(async (resolve, reject) => {
      try {
        const totalStudent = await studentModel.countDocuments(pipeline);
        return resolve(totalStudent);
      } catch (error) {
        return reject(error);
      }
    });
  },
  getStudentDataFilter: function (pipeline) {
    return new Promise(async (resolve, reject) => {
      try {
        const studentList = await getStudentData(pipeline);
        return resolve(studentList);
      } catch (error) {
        return reject(error);
      }
    });
  },
  getStudentWithPaymentDetails: function (
    startDate,
    endDate,
    searchText,
    courseId,
    skip,
    limit,
    paymentStatus
  ) {
    return new Promise(async (resolve, reject) => {
      try {
        const payments = await paymentModel
          .find({
            courseId: mongoose.Types.ObjectId(courseId),
            studentId: { $ne: null },
            created: { $gte: startDate, $lte: endDate },
          })
          .select("studentId");
        const studentIds = payments.map((p) => p.studentId);
        const studentList = await getTotalStudent(
          courseId,
          studentIds,
          skip,
          limit,
          searchText,
          paymentStatus
        );
        const studentListCount = await getTotalStudentCount(
          courseId,
          studentIds,
          searchText,
          paymentStatus
        );
        let total = studentListCount.length > 0 ? studentListCount[0].total : 0;
        return resolve({ studentList, total });
      } catch (error) {
        return reject(error);
      }
    });
  },
  getStudentWithBrathDtoxPaymentDetails: function (
    startDate,
    endDate,
    searchText,
    courseId,
    skip,
    limit
  ) {
    return new Promise(async (resolve, reject) => {
      try {
        const payments = await paymentModel
          .find({
            courseId: mongoose.Types.ObjectId(courseId),
            studentId: { $ne: null },
            created: { $gte: startDate, $lte: endDate },
          })
          .select("studentId");
        const studentIds = payments.map((p) => p.studentId);
        const studentList = await getTotalbDtoxStudent(
          courseId,
          studentIds,
          skip,
          limit,
          searchText
        );
        const studentListCount = await getTotalbDtoxStudentCount(
          courseId,
          studentIds,
          searchText
        );
        let total = studentListCount.length > 0 ? studentListCount[0].total : 0;
        return resolve({ studentList, total });
      } catch (error) {
        return reject(error);
      }
    });
  },
  getAllLiveClassStudent: function (pipeLine, pipeLineCount) {
    return new Promise(async (resolve, reject) => {
      try {
        const totalData = await liveCoursesCustomerModel.aggregate(
          pipeLineCount
        );
        const studentList = await liveCoursesCustomerModel.aggregate(pipeLine);
        return resolve({ studentList, totalData });
      } catch (error) {
        return reject(error);
      }
    });
  },
  getAllSwaraSadhanaData: function (pipeLine, pipeLineCount) {
    return new Promise(async (resolve, reject) => {
      try {
        const totalData = await webinarRegisterUser.aggregate(pipeLineCount);
        const studentList = await webinarRegisterUser.aggregate(pipeLine);
        return resolve({ studentList, totalData });
      } catch (error) {
        return reject(error);
      }
    });
  },

  getAllFreeWebinarData: function (pipeLine, pipeLineCount) {
    return new Promise(async (resolve, reject) => {
      try {
        const totalData = await freeWebinarModel.aggregate(pipeLineCount);
        const studentList = await freeWebinarModel.aggregate(pipeLine);
        return resolve({ studentList, totalData });
      } catch (error) {
        return reject(error);
      }
    });
  },

  getAggregateStudentData: function (pipeLine) {
    return new Promise(async (resolve, reject) => {
      try {
        const result = getStudentData(pipeLine);
        return resolve(result);
      } catch (error) {
        return reject(error);
      }
    });
  },
  updateStudent: function (reqBody) {
    return new Promise(async (resolve, reject) => {
      try {
        const student = await studentModel.findOneAndUpdate(
          { _id: reqBody._id },
          reqBody
        );
        return resolve(student);
      } catch (error) {
        return reject(error);
      }
    });
  },
  createStudent: function (reqBody) {
    return new Promise(async (resolve, reject) => {
      try {
        const student = await studentModel.create(reqBody);
        return resolve(student);
      } catch (error) {
        return reject(error);
      }
    });
  },
  getStudentById: function (id) {
    return new Promise(async (resolve, reject) => {
      try {
        const student = await studentModel.findOne({ _id: id });
        return resolve(student);
      } catch (error) {
        return reject(error);
      }
    });
  },
  updateStudentCourse: function (id, updatedCourses) {
    return new Promise(async (resolve, reject) => {
      try {
        await studentModel.findOneAndUpdate(
          { _id: id },
          { course: updatedCourses }
        );
        return resolve(1);
      } catch (error) {
        return reject(error);
      }
    });
  },
  getPranicPurificationData: function (pipeline) {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await pranicPurificationModel.aggregate(pipeline);
        return resolve(result);
      } catch (error) {
        return reject(error);
      }
    });
  },
  getStudentVideoByCourse: function (courseId) {
    return new Promise(async (resolve, reject) => {
      try {
        const getVideoData = await onlineVideoModel.find({
          courseId: courseId,
        });
        return resolve(getVideoData);
      } catch (error) {
        return reject(error);
      }
    });
  },
  get200ttcData: function (pipeline) {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await twoHundredHourTTCModel.aggregate(pipeline);
        return resolve(result);
      } catch (error) {
        return reject(error);
      }
    });
  },
  createLiveClassData: function (data) {
    return new Promise(async (resolve, reject) => {
      try {
        const result = liveCoursesCustomerModel.create(data);
        return resolve(result);
      } catch (error) {
        return reject(error);
      }
    });
  },
  getStudentById: function (id) {
    return new Promise(async (resolve, reject) => {
      try {
        const student = await studentModel.findById(id).lean();
        return resolve(student);
      } catch (error) {
        return reject(error);
      }
    });
  },
  registerSwaraSadhanaStudentByAdmin: function (savedData) {
    return new Promise(async (resolve, reject) => {
      try {
        const newUser = new webinarUser(savedData);
        const savedUser = await newUser.save();
        return resolve(savedUser);
      } catch (error) {
        return reject(error);
      }
    });
  },
  registerPranicPurificationStudentByAdmin: function (savedData) {
    return new Promise(async (resolve, reject) => {
      try {
        const newUser = new pranicPurificationModel(savedData);
        const savedUser = await newUser.save();
        return resolve(savedUser);
      } catch (error) {
        return reject(error);
      }
    });
  },
  register200TTCStudentByAdmin: function (savedData) {
    return new Promise(async (resolve, reject) => {
      try {
        const newUser = new twoHundredHourTTCModel(savedData);
        const savedUser = await newUser.save();
        return resolve(savedUser);
      } catch (error) {
        return reject(error);
      }
    });
  },
};
let getStudentData = async function (pipeline) {
  const studentList = await studentModel.aggregate(pipeline);
  return studentList;
};
let getTotalStudent = async function (
  courseId,
  studentIds,
  skip,
  limit,
  searchText,
  paymentStatus
) {
  let pipeline = [
    { $match: { _id: { $in: studentIds }, course: courseId } },
    { $sort: { created: -1 } },
    { $skip: skip },
    { $limit: limit },
    {
      $lookup: {
        from: "payments",
        localField: "_id",
        foreignField: "studentId",
        as: "paymentDetails",
        pipeline: [
          {
            $match: paymentStatus
              ? {
                  paymentStatus: { $regex: paymentStatus, $options: "i" },
                }
              : {},
          },
        ],
      },
    },
  ];
  if (searchText) {
    pipeline.splice(1, 0, {
      $match: {
        $or: [
          { firstName: { $regex: searchText, $options: "i" } },
          { email: { $regex: searchText, $options: "i" } },
        ],
      },
    });
  }
  let studentList = await getStudentData(pipeline);
  return studentList;
};
let getTotalStudentCount = async function (
  courseId,
  studentIds,
  searchText,
  paymentStatus
) {
  let pipeline = [
    { $match: { _id: { $in: studentIds }, course: courseId } },
    { $sort: { created: -1 } },
    { $count: "total" },
    {
      $lookup: {
        from: "payments",
        localField: "_id",
        foreignField: "studentId",
        as: "paymentDetails",
        pipeline: [
          {
            $match: paymentStatus
              ? {
                  paymentStatus: { $regex: paymentStatus, $options: "i" },
                }
              : {},
          },
        ],
      },
    },
  ];
  if (searchText) {
    pipeline.splice(1, 0, {
      $match: {
        $or: [
          { firstName: { $regex: searchText, $options: "i" } },
          { email: { $regex: searchText, $options: "i" } },
        ],
      },
    });
  }
  let studentListCount = await getStudentData(pipeline);
  return studentListCount;
};
let getTotalbDtoxStudent = async function (
  courseId,
  studentIds,
  skip,
  limit,
  searchText
) {
  let pipeline = [
    { $match: { _id: { $in: studentIds }, course: courseId } },
    { $sort: { created: -1 } },
    { $skip: skip },
    { $limit: limit },
    {
      $lookup: {
        from: "payments",
        localField: "_id",
        foreignField: "studentId",
        as: "paymentDetails",
      },
    },
  ];
  if (searchText) {
    pipeline.splice(1, 0, {
      $match: {
        $or: [
          { firstName: { $regex: searchText, $options: "i" } },
          { lastName: { $regex: searchText, $options: "i" } },
          { email: { $regex: searchText, $options: "i" } },
          { city: { $regex: searchText, $options: "i" } },
          {
            $expr: {
              $regexMatch: {
                input: { $toString: "$phoneNumber" },
                regex: searchText,
                options: "i",
              },
            },
          },
        ],
      },
    });
  }
  let studentList = await getStudentData(pipeline);
  return studentList;
};
let getTotalbDtoxStudentCount = async function (
  courseId,
  studentIds,
  searchText
) {
  let pipeline = [
    { $match: { _id: { $in: studentIds }, course: courseId } },
    { $sort: { created: -1 } },
    { $count: "total" },
    {
      $lookup: {
        from: "payments",
        localField: "_id",
        foreignField: "studentId",
        as: "paymentDetails",
      },
    },
  ];
  if (searchText) {
    pipeline.splice(1, 0, {
      $match: {
        $or: [
          { firstName: { $regex: searchText, $options: "i" } },
          { lastName: { $regex: searchText, $options: "i" } },
          { email: { $regex: searchText, $options: "i" } },
          { city: { $regex: searchText, $options: "i" } },
          {
            $expr: {
              $regexMatch: {
                input: { $toString: "$phoneNumber" },
                regex: searchText,
                options: "i",
              },
            },
          },
        ],
      },
    });
  }
  let studentListCount = await getStudentData(pipeline);
  return studentListCount;
};
