"use strict";
const studentRepo = require("../repositories/studentRepository");
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
        studentObj = await getBrathDtoxAllData(
              courseId,
              skip,
              limit,
              searchText,
              startDate,
              endDate
        );
        studentList = studentObj.studentList;
        totalStudent = studentObj.totalData;
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
        const course = reqBody.course;
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
          { $sort: { created: -1 } },
          {
            $match: {
              "courses.title": course,
            },
          },
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              name: "$name",
              email: "$email",
              phone: "$phone",
              currency: "$currency",
              price: "$price",
              paymentStatus: "$paymentStatus",
              created: "$created",
              courseTimming: {
                $let: {
                  vars: {
                    matchedCourse: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: "$courses",
                            as: "c",
                            cond: { $eq: ["$$c.title", course] },
                          },
                        },
                        0,
                      ],
                    },
                  },
                  in: "$$matchedCourse.shortDescription",
                },
              },
            },
          },
        ];
        let pipeLineCount = [
          { $sort: { created: -1 } },
          {
            $match: {
              "courses.title": { $regex: course, $options: "i" },
            },
          },
          {
            $count: "total",
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
        const totalData =
          studentObj && studentObj.totalData.length > 0
            ? studentObj.totalData[0]?.total
            : 0;
        return resolve({ studentList, totalData });
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
  getAllFoundationOfSpiritualityStudent: function (reqBody) {
    return new Promise(async (resolve, reject) => {
      try {
        let courseId = constants.COURSE.FOUNDATION_SPIRITUALITY;
        let size = reqBody.size || 10;
        let pageNo = reqBody.pageNo || 1;
        let searchText = reqBody.searchText;
        const skip = Number(size * (pageNo - 1));
        const limit = Number(size) || 0;
        const filterCondition = {
          course: courseId,
          ...(searchText && {
            $or: [
              { firstName: { $regex: searchText, $options: "i" } },
              { lastName: { $regex: searchText, $options: "i" } },
              { email: { $regex: searchText, $options: "i" } },
            ],
          }),
        };
        const totalStudent = await studentRepo.getStudentCountFilter(
          filterCondition
        );
        const studentList = await studentRepo.getAggregateStudentData([
          { $match: filterCondition },
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
          // {
          //   $match: {
          //     "paymentDetails.0": { $exists: true },
          //   },
          // },
        ]);
        return resolve({ studentList, totalStudent });
      } catch (error) {
        return reject(error);
      }
    });
  },
  createUpdateStudent: function (reqBody) {
    return new Promise(async (resolve, reject) => {
      try {
        if (reqBody._id) {
          await studentRepo.updateStudent(reqBody);
          return resolve({ status: "ok", msg: `Student updated Successfully` });
        } else {
          reqBody.email = reqBody.email.toLowerCase();
          const student = await studentRepo.createStudent(reqBody);
          if (reqBody.source == "web") {
            //sendRegistrationEmailV2(student._id);
          } else if (reqBody.source == "admin") {
            // sendRegistrationEmail(student._id);
          }
          return resolve({
            status: "ok",
            msg: "Student Registerd Success",
            studentId: student._id,
          });
        }
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
let getBrathDtoxAllData = async function (courseId, skip, limit, searchText, fromDate, toDate) {
  let studentList;
  let matchStage = { course: courseId };

  if (fromDate && toDate) 
    {
      matchStage.created = {};
      if (fromDate) matchStage.created.$gte = new Date(fromDate);
      if (toDate) matchStage.created.$lte = new Date(toDate);
    }
  let pipeline = [
    { $match: matchStage },
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
  const totalData = await getBrathDtoxCount(courseId, searchText, fromDate, toDate);
  return { studentList, totalData };
};

let getBrathDtoxCount = async function (courseId, searchText, fromDate, toDate) {
  let filterCondition = {
    course: courseId,
  };

  if (fromDate && toDate) {
    filterCondition.created = {};
    if (fromDate) filterCondition.created.$gte = new Date(fromDate);
    if (toDate) filterCondition.created.$lte = new Date(toDate);
  }

  if (searchText) {
    filterCondition.$or = [
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
    ];
  }

  const totalStudent = await studentRepo.getStudentCountFilter(filterCondition);
  return totalStudent;
};

