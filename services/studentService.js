"use strict";
const studentRepo = require("../repositories/studentRepository");

module.exports = {
  getAllParayanamStudent: function (reqBody) {
    return new Promise(async (resolve, reject) => {
      try {
        let courseId = "644f9dfc499ffcfb45df35cd";
        let size = reqBody.size || 10;
        let pageNo = reqBody.pageNo || 1;
        let searchText = reqBody.searchText;
        let startDate =
          reqBody.fromDate ??
          new Date(new Date(reqBody.fromDate) - 5.5 * 60 * 60 * 1000);
        let endDate =
          reqBody.toDate ??
          new Date(new Date(reqBody.toDate) - 5.5 * 60 * 60 * 1000);
        const skip = Number(size * (pageNo - 1));
        const limit = Number(size) || 0;
        let studentObj;
        let studentList;
        let totalStudent = 0;
        if (!startDate && !endDate) {
          studentObj = await getPranaArmbhAllData(
            courseId,
            skip,
            limit,
            searchText
          );
          studentList = studentObj.studentList;
          totalStudent = studentObj.totalData;
        } else {
          studentObj = await studentRepo.getStudentWithPaymentDetails(
            startDate,
            endDate,
            searchText,
            courseId,
            skip,
            limit
          );
          studentList = studentObj.studentList;
          totalStudent = studentObj.total;
        }
        return resolve({
          totalStudent,
          studentList,
        });
      } catch (error) {
        return reject(error);
      }
    });
  },
};
let getPranaArmbhAllData = async function (courseId, skip, limit, searchText) {
  let studentList;
  let pipeline = [
    { $match: { course: courseId } },
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
  studentList = await studentRepo.getStudentDataFilter(pipeline);
  const totalData = await getPranaArmbhCount(courseId, searchText);
  return { studentList, totalData };
};
let getPranaArmbhCount = async function (courseId, searchText) {
  let totalStudent = 0;
  let filterCondition = {
    course: courseId,
    ...(searchText && {
      $or: [
        { firstName: { $regex: searchText, $options: "i" } },
        { email: { $regex: searchText, $options: "i" } },
      ],
    }),
  };
  totalStudent = await studentRepo.getStudentCountFilter(filterCondition);
  return totalStudent;
};
