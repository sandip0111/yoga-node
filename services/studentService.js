"use strict";
const studentRepo = require("../repositories/studentRepository");
const Student = require("../models/StudentModel");
const constants = require("../helpers/constants.json");

module.exports = {
  getAllParayanamStudent: function (reqBody) {
    return new Promise(async (resolve, reject) => {
      try {
        let courseId = constants.COURSE.PRANA_ARAMBHA;
        let size = reqBody.size || 10;
        let pageNo = reqBody.pageNo || 1;
        let searchText = reqBody.searchText;
        let startDate = reqBody.fromDate ? new Date(reqBody.fromDate) : null;
        let endDate = reqBody.toDate ? new Date(reqBody.toDate) : null;
        if (startDate) {
          startDate.setHours(0, 0, 0, 0);
        }
        if (endDate) {
          endDate.setHours(23, 59, 59, 999);
        }
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
  getAllBreathDtoxStudent: function (reqBody) {
    return new Promise(async (resolve, reject) => {
      try {
        let courseId = constants.COURSE.BREATCH_DTOX;
        let size = reqBody.size || 10;
        let pageNo = reqBody.pageNo || 1;
        let searchText = reqBody.searchText;
        let startDate = reqBody.fromDate ? new Date(reqBody.fromDate) : null;
        let endDate = reqBody.toDate ? new Date(reqBody.toDate) : null;
        if (startDate) {
          startDate.setHours(0, 0, 0, 0);
        }
        if (endDate) {
          endDate.setHours(23, 59, 59, 999);
        }
        const skip = Number(size * (pageNo - 1));
        const limit = Number(size) || 0;
        let studentObj;
        let studentList;
        let totalStudent = 0;
        if (!startDate && !endDate) {
          studentObj = await getBrathDtoxAllData(
            courseId,
            skip,
            limit,
            searchText
          );
          studentList = studentObj.studentList;
          totalStudent = studentObj.totalData;
        } else {
          studentObj = await studentRepo.getStudentWithBrathDtoxPaymentDetails(
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
          studentList,
          totalStudent,
        });
      } catch (error) {
        return reject(error);
      }
    });
  },
  getAllLiveClassStudent: function (reqBody) {
    return new Promise(async (resolve, reject) => {
      try {
        let size = reqBody.size || 10;
        let pageNo = reqBody.pageNo || 1;
        const skip = Number(size * (pageNo - 1));
        const limit = Number(size) || 0;
        let searchText = reqBody.searchText;
        let startDate = reqBody.fromDate ? new Date(reqBody.fromDate) : null;
        let endDate = reqBody.toDate ? new Date(reqBody.toDate) : null;
        if (startDate) {
          startDate.setHours(0, 0, 0, 0);
        }
        if (endDate) {
          endDate.setHours(23, 59, 59, 999);
        }
        let pipeLine = [
          { $unwind: "$courses" },
          { $sort: { created: -1 } },
          { $skip: skip },
          { $limit: limit },
          {
            $group: {
              _id: "$courses.title",
              totalCustomers: { $sum: 1 },
              customers: {
                $push: {
                  _id: "$_id",
                  name: "$name",
                  email: "$email",
                  phone: "$phone",
                  currency: "$currency",
                  price: "$price",
                  paymentStatus: "$paymentStatus",
                  created: "$created",
                  courses: {
                    _id: "$courses._id",
                    title: "$courses.title",
                    shortDescription: "$courses.shortDescription",
                    priceINR: "$courses.priceINR",
                    priceUSD: "$courses.priceUSD",
                    quantity: "$courses.quantity",
                    priceInfo: "$courses.priceInfo",
                  },
                },
              },
            },
          },
        ];
        let pipeLineCount = [
          { $unwind: "$courses" },
          {
            $group: {
              _id: "$courses.title",
              totalCustomers: { $sum: 1 },
            },
          },
        ];
        if (searchText) {
          pipeLine.splice(1, 0, {
            $match: {
              $or: [
                { name: { $regex: searchText, $options: "i" } },
                { email: { $regex: searchText, $options: "i" } },
                { phone: { $regex: searchText, $options: "i" } },
              ],
            },
          });
          pipeLineCount.splice(1, 0, {
            $match: {
              $or: [
                { name: { $regex: searchText, $options: "i" } },
                { email: { $regex: searchText, $options: "i" } },
                { phone: { $regex: searchText, $options: "i" } },
              ],
            },
          });
        }
        if (startDate && endDate) {
          pipeLine.splice(1, 0, {
            $match: {
              $and: [
                { created: { $gte: startDate } },
                { created: { $lte: endDate } },
              ],
            },
          });
          pipeLineCount.splice(1, 0, {
            $match: {
              $and: [
                { created: { $gte: startDate } },
                { created: { $lte: endDate } },
              ],
            },
          });
        }
        const studentObj = await studentRepo.getAllLiveClassStudent(
          pipeLine,
          pipeLineCount
        );
        const studentList = studentObj.studentList;
        for (let obj of studentList) {
          const totalObj = studentObj.totalData.find((a) => a._id == obj._id);
          obj.totalCustomers = totalObj
            ? totalObj.totalCustomers
            : obj.totalCustomers;
        }
        return resolve(studentList);
      } catch (error) {
        return reject(error);
      }
    });
  },
  getAllSwaraSadhanaData: function (reqBody) {
    return new Promise(async (resolve, reject) => {
      try {
        const courseId = constants.COURSE.SWAR_SADHNA;
        let size = reqBody.size || 10;
        let pageNo = reqBody.pageNo || 1;
        const skip = Number(size * (pageNo - 1));
        const limit = Number(size) || 0;
        const searchText = reqBody.searchText;
        let startDate = reqBody.fromDate ? new Date(reqBody.fromDate) : null;
        let endDate = reqBody.toDate ? new Date(reqBody.toDate) : null;
        if (startDate) {
          startDate.setHours(0, 0, 0, 0);
        }
        if (endDate) {
          endDate.setHours(23, 59, 59, 999);
        }
        let pipeLine = [
          { $match: { webinar: courseId } },
          { $sort: { _id: -1 } },
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              name: "$name",
              email: "$email",
              phone: "$phone",
              city: "$city",
              paymentStatus: "$paymentStatus",
              created: "$created",
            },
          },
        ];
        let pipeLineCount = [
          { $match: { webinar: courseId } },
          { $count: "total" },
        ];
        if (searchText) {
          pipeLine.splice(1, 0, {
            $match: {
              $or: [
                { name: { $regex: searchText, $options: "i" } },
                { email: { $regex: searchText, $options: "i" } },
                { phone: { $regex: searchText, $options: "i" } },
              ],
            },
          });
          pipeLineCount.splice(1, 0, {
            $match: {
              $or: [
                { name: { $regex: searchText, $options: "i" } },
                { email: { $regex: searchText, $options: "i" } },
                { phone: { $regex: searchText, $options: "i" } },
              ],
            },
          });
        }
        if (startDate && endDate) {
          pipeLine.splice(1, 0, {
            $match: {
              $and: [
                { created: { $gte: startDate } },
                { created: { $lte: endDate } },
              ],
            },
          });
          pipeLineCount.splice(1, 0, {
            $match: {
              $and: [
                { created: { $gte: startDate } },
                { created: { $lte: endDate } },
              ],
            },
          });
        }
        const swarData = await studentRepo.getAllSwaraSadhanaData(
          pipeLine,
          pipeLineCount
        );
        const studentList = swarData?.studentList;
        const totalData = swarData?.totalData[0]?.total;
        return resolve({ studentList, totalData });
      } catch (error) {
        return reject(error);
      }
    });
  },
};
let getPranaArmbhAllData2 = async function (courseId, skip, limit, searchText) {
  let studentList;
  let pipeline = [
    { $match: { course: courseId } }, // Match students by course
    { $sort: { created: -1 } }, // Sort by creation date (descending)
  ];

  // If searchText is provided, add a match condition to filter by firstName or email
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

  // Lookup to join payment details (this is kept before unwinding for fetching)
  pipeline.push({
    $lookup: {
      from: "payments",
      localField: "_id",
      foreignField: "studentId",
      as: "paymentDetails",
    },
  });

  // Unwind the paymentDetails array to flatten it
  pipeline.push({ $unwind: "$paymentDetails" });

  // Pagination logic (skip and limit)
  pipeline.push({ $skip: skip }, { $limit: limit });
  // studentList = await studentRepo.getStudentDataFilter(pipeline);

  // Use the same pipeline for both counting and fetching data using $facet
  let facetPipeline = [
    { $match: { course: courseId } }, // Match students by course
  ];

  if (searchText) {
    facetPipeline.push({
      $match: {
        $or: [
          { firstName: { $regex: searchText, $options: "i" } },
          { email: { $regex: searchText, $options: "i" } },
        ],
      },
    });
  }

  // Use $facet to run both count and data fetching in parallel
  facetPipeline.push({
    $facet: {
      data: [
        {
          $lookup: {
            from: "payments",
            localField: "_id",
            foreignField: "studentId",
            as: "paymentDetails",
          },
        },
        { $unwind: "$paymentDetails" },
        { $skip: skip },
        { $limit: limit },
      ],
      totalCount: [
        // We must apply unwind here for counting purposes
        {
          $lookup: {
            from: "payments",
            localField: "_id",
            foreignField: "studentId",
            as: "paymentDetails",
          },
        },
        { $unwind: "$paymentDetails" },
        { $count: "total" }, // Count after unwind
      ],
    },
  });

  // Execute the pipeline to fetch both student data and total count concurrently
  const result = await studentRepo.getStudentDataFilter(facetPipeline);
  studentList = result[0].data;
  const totalData =
    result[0].totalCount.length > 0 ? result[0].totalCount[0].total : 0;

  return { studentList, totalData };
};
let getPranaArmbhAllData = async function (courseId, skip, limit, searchText) {
  let studentList;
  let pipeline = [{ $match: { course: courseId } }, { $sort: { created: -1 } }];
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
  pipeline.push({
    $lookup: {
      from: "payments",
      localField: "_id",
      foreignField: "studentId",
      as: "paymentDetails",
    },
  });
  // pipeline.push({ $unwind: "$paymentDetails" });
  // const allStudentList = await studentRepo.getStudentDataFilter(pipeline);
  // const totalData = allStudentList?.length;
  pipeline.push({ $skip: skip }, { $limit: limit });
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
let getBrathDtoxAllData = async function (courseId, skip, limit, searchText) {
  let studentList;
  let pipeline = [
    { $match: { course: courseId } },
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
    // {
    //   $match: {
    //     "paymentDetails.0": { $exists: true },
    //   },
    // },
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
  studentList = await studentRepo.getStudentDataFilter(pipeline);
  const totalData = await getBrathDtoxCount(courseId, searchText);
  return { studentList, totalData };
};
let getBrathDtoxCount = async function (courseId, searchText) {
  let totalStudent = 0;
  let filterCondition = {
    course: courseId,
    ...(searchText && {
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
    }),
  };
  totalStudent = await studentRepo.getStudentCountFilter(filterCondition);
  return totalStudent;
};
