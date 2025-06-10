"use strict";
const Student = require("../models/StudentModel");
const Payment = require("../models/PaymentModel");
const mongoose = require("mongoose");
// const moment = require('moment-timezone');
module.exports = {
  getStudentCountFilter: function (pipeline) {
    return new Promise(async (resolve, reject) => {
      try {
        const totalStudent = await Student.countDocuments(pipeline);
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
    limit
  ) {
    return new Promise(async (resolve, reject) => {
      try {
        const payments = await Payment.find({
          courseId: mongoose.Types.ObjectId(courseId),
          studentId: { $ne: null },
          created: { $gte: startDate, $lte: endDate },
        }).select("studentId");
        const studentIds = payments.map((p) => p.studentId);
        const studentList = await getTotalStudent(
          courseId,
          studentIds,
          skip,
          limit,
          searchText
        );
        const studentListCount = await getTotalStudentCount(
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
};
let getStudentData = async function (pipeline) {
  const studentList = await Student.aggregate(pipeline);
  return studentList;
};
let getTotalStudent = async function (
  courseId,
  studentIds,
  skip,
  limit,
  searchText
) {
  let pipeline = [
    { $match: { _id: { $in: studentIds }, course: courseId } },
    { $sort: { created: -1 } },
    {
      $lookup: {
        from: "payments",
        localField: "_id",
        foreignField: "studentId",
        as: "paymentDetails",
      },
    },
    { $skip: skip },
    { $limit: limit },
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
let getTotalStudentCount = async function (courseId, studentIds, searchText) {
  let pipeline = [
    { $match: { _id: { $in: studentIds }, course: courseId } },
    { $sort: { created: -1 } },
    {
      $lookup: {
        from: "payments",
        localField: "_id",
        foreignField: "studentId",
        as: "paymentDetails",
      },
    },
    { $count: "total" },
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
