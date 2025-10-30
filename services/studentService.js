"use strict";
const studentRepo = require("../repositories/studentRepository");
const constants = require("../helpers/constants.json");
const paymentRepo = require("../repositories/paymentRepository");
const s3Bucket = require("../services/s3_bucket");
const helper = require("../helpers/helper");
const sendMail = require("../helpers/nodemail");

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
            searchText,
            reqBody.paymentStatus
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
            limit,
            reqBody.paymentStatus
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
        const month = reqBody.month ? reqBody.month : null;
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
              "courses.title": { $regex: course, $options: "i" },
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
              paymentType: "$paymentType",
              created: "$created",
              month: "$month",
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
        if (reqBody.paymentType) {
          pipeLine.splice(1, 0, {
            $match: {
              $or: [
                { paymentType: { $regex: reqBody.paymentType, $options: "i" } },
              ],
            },
          });
          pipeLineCount.splice(1, 0, {
            $match: {
              $or: [
                { paymentType: { $regex: reqBody.paymentType, $options: "i" } },
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
        // 🗓️ Month filter (direct column in DB)
        if (month) {
          const monthMatch = { month: month };
          pipeLine.splice(1, 0, { $match: monthMatch });
          pipeLineCount.splice(1, 0, { $match: monthMatch });
        }
        if (reqBody.paymentStatus) {
          const payStatusMatch = { paymentStatus: reqBody.paymentStatus };
          pipeLine.splice(1, 0, { $match: payStatusMatch });
          pipeLineCount.splice(1, 0, { $match: payStatusMatch });
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
        const courseId = "Swara Sadhana";
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
              password: "$password",
              paymentType: "$paymentType",
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
        if (reqBody.paymentType) {
          pipeLine.splice(1, 0, {
            $match: {
              $or: [
                { paymentType: { $regex: reqBody.paymentType, $options: "i" } },
              ],
            },
          });
          pipeLineCount.splice(1, 0, {
            $match: {
              $or: [
                { paymentType: { $regex: reqBody.paymentType, $options: "i" } },
              ],
            },
          });
        }
        if (reqBody.paymentStatus) {
          const payStatusMatch = { paymentStatus: reqBody.paymentStatus };
          pipeLine.splice(1, 0, { $match: payStatusMatch });
          pipeLineCount.splice(1, 0, { $match: payStatusMatch });
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

  getAllFreeWebinarData: function (reqBody) {
    return new Promise(async (resolve, reject) => {
      try {
        let size = reqBody.size || 10;
        let pageNo = reqBody.pageNo || 1;
        const skip = Number(size * (pageNo - 1));
        const limit = Number(size) || 0;
        const searchText = reqBody.searchText;

        let pipeLine = [
          { $sort: { _id: -1 } },
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              name: "$name",
              email: "$email",
              created: "$created",
              webinarDate: "$webinarDate",
            },
          },
        ];
        let pipeLineCount = [{ $count: "total" }];
        if (searchText) {
          pipeLine.splice(0, 0, {
            $match: {
              $or: [
                { name: { $regex: searchText, $options: "i" } },
                { email: { $regex: searchText, $options: "i" } },
              ],
            },
          });
          pipeLineCount.splice(0, 0, {
            $match: {
              $or: [
                { name: { $regex: searchText, $options: "i" } },
                { email: { $regex: searchText, $options: "i" } },
              ],
            },
          });
        }
        const freeData = await studentRepo.getAllFreeWebinarData(
          pipeLine,
          pipeLineCount
        );
        const studentList = freeData?.studentList;
        const totalData = freeData?.totalData[0]?.total;
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
          if (reqBody.isBreatDox) {
            await helper.sendRegistrationEmailV2(student._id);
          } else if (reqBody.source == "admin") {
            await helper.sendRegistrationEmail(student._id);
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
  getAllPranicPurificationStudent: function (reqBody) {
    return new Promise(async (resolve, reject) => {
      try {
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
          { $sort: { _id: -1 } },
          { $skip: skip },
          { $limit: limit },
        ];
        let pipeLineCount = [{ $count: "total" }];
        if (searchText) {
          pipeLine.splice(1, 0, {
            $match: {
              $or: [
                { name: { $regex: searchText, $options: "i" } },
                { email: { $regex: searchText, $options: "i" } },
                { phoneNumber: { $regex: searchText, $options: "i" } },
                { address: { $regex: searchText, $options: "i" } },
                { couponcode: { $regex: searchText, $options: "i" } },
              ],
            },
          });
          pipeLineCount.unshift({
            $match: {
              $or: [
                { name: { $regex: searchText, $options: "i" } },
                { email: { $regex: searchText, $options: "i" } },
                { phoneNumber: { $regex: searchText, $options: "i" } },
                { address: { $regex: searchText, $options: "i" } },
                { couponcode: { $regex: searchText, $options: "i" } },
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
          pipeLineCount.unshift({
            $match: {
              $and: [
                { created: { $gte: startDate } },
                { created: { $lte: endDate } },
              ],
            },
          });
        }
        let studentList = await studentRepo.getPranicPurificationData(pipeLine);
        for (let obj of studentList) {
          const couponPipe = { studentId: obj._id };
          const couponCodeData = await paymentRepo.getCoupondataById(
            couponPipe
          );
          if (couponCodeData) {
            obj.couponcode = couponCodeData.code;
            obj.couponUsed = couponCodeData.isUsed;
          } else {
            obj.couponcode = null;
            obj.couponUsed = null;
          }
        }
        let studentTotal = await studentRepo.getPranicPurificationData(
          pipeLineCount
        );
        return resolve({
          studentList: studentList,
          studentTotal:
            studentTotal && studentTotal.length == 1
              ? studentTotal[0].total
              : 0,
        });
      } catch (error) {
        return reject(error);
      }
    });
  },
  getCourseVideosById: function (reqBody) {
    return new Promise(async (resolve, reject) => {
      try {
        const getVideoData = await studentRepo.getStudentVideoByCourse(
          reqBody.courseId
        );
        let arr = [];
        if (reqBody.courseId == constants.COURSE.PRANA_ARAMBHA) {
          arr = await pranaySadhanaCourseVideo(getVideoData);
        } else {
          arr = await allCourseVideo(getVideoData, reqBody);
        }
        return resolve(arr);
      } catch (err) {
        return reject(err);
      }
    });
  },
  getTabVideo: function (reqBody) {
    return new Promise(async (resolve, reject) => {
      try {
        let key = `upCourses/${constants.S3_BUCKET.PRANAYAM_SADHANA_FOLDER}/${reqBody.fileName}.mp4`;
        const url = await s3Bucket.getPresignedUrl("yogacourses", key);
        const newUrl = url.replace(
          "yogacourses.s3.us-east-1.amazonaws.com",
          "d3mzqk1fxuwngx.cloudfront.net"
        );
        return resolve(newUrl);
      } catch (err) {
        return reject(err);
      }
    });
  },
  get200ttcData: function (reqBody) {
    return new Promise(async (resolve, reject) => {
      try {
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
          { $sort: { _id: -1 } },
          { $skip: skip },
          { $limit: limit },
        ];
        let pipeLineCount = [{ $count: "total" }];
        if (searchText) {
          pipeLine.splice(1, 0, {
            $match: {
              $or: [
                { name: { $regex: searchText, $options: "i" } },
                { email: { $regex: searchText, $options: "i" } },
                { phoneNumber: { $regex: searchText, $options: "i" } },
              ],
            },
          });
          pipeLineCount.unshift({
            $match: {
              $or: [
                { name: { $regex: searchText, $options: "i" } },
                { email: { $regex: searchText, $options: "i" } },
                { phoneNumber: { $regex: searchText, $options: "i" } },
              ],
            },
          });
        }
        if (reqBody.paymentType) {
          pipeLine.splice(1, 0, {
            $match: {
              $or: [
                { paymentType: { $regex: reqBody.paymentType, $options: "i" } },
              ],
            },
          });
          pipeLineCount.splice(1, 0, {
            $match: {
              $or: [
                { paymentType: { $regex: reqBody.paymentType, $options: "i" } },
              ],
            },
          });
        }
        if (reqBody.paymentStatus) {
          const payStatusMatch = { paymentStatus: reqBody.paymentStatus };
          pipeLine.splice(1, 0, { $match: payStatusMatch });
          pipeLineCount.splice(1, 0, { $match: payStatusMatch });
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
          pipeLineCount.unshift({
            $match: {
              $and: [
                { created: { $gte: startDate } },
                { created: { $lte: endDate } },
              ],
            },
          });
        }
        let studentList = await studentRepo.get200ttcData(pipeLine);
        let studentTotal = await studentRepo.get200ttcData(pipeLineCount);
        return resolve({
          studentList: studentList,
          studentTotal:
            studentTotal && studentTotal.length == 1
              ? studentTotal[0].total
              : 0,
        });
      } catch (error) {
        return reject(error);
      }
    });
  },
  sendMailToPrashantJi: function (reqBody) {
    return new Promise(async (resolve, reject) => {
      try {
        console.log(reqBody);
        const fileName = constants.EMAIL_TEMPLATE.ONLINE_PRASHANT;
        let mailData = {
          replacements: {
            NAME: reqBody.name,
          },
          mailTo: reqBody.email,
          contentPath: fileName,
          subject: "Welcome to Your Online Sadhana with Prashantji",
        };
        sendMail.createContent(mailData);
        return resolve(1);
      } catch (error) {
        return reject(error);
      }
    });
  },
};
let pranaySadhanaCourseVideo = function (getVideoData) {
  return new Promise(async (resolve, reject) => {
    try {
      let arr = [];
      getVideoData.map((obj) => {
        let val = {
          updateId: obj._id,
          title: obj.title,
          sortBy: obj.sortBy,
          url: obj.videoName,
        };
        arr.push(val);
      });
      return resolve(arr);
    } catch (err) {
      return reject(err);
    }
  });
};
let allCourseVideo = function (getVideoData, reqBody) {
  return new Promise(async (resolve, reject) => {
    try {
      const params = {
        Bucket: "yogacourses",
        Prefix: `upCourses/${reqBody.courseId}/`,
        Delimiter: "/",
      };
      let allObjects = [];
      let continuationToken = null;
      do {
        if (continuationToken) {
          params.ContinuationToken = continuationToken;
        }
        const res = await s3Bucket.getListObject(params, allObjects);
        allObjects = allObjects.concat(res.filteredObjects);
        if (allObjects.length >= 1000) {
          allObjects = allObjects.slice(0, 1000);
          break;
        }
        continuationToken = res.response.NextContinuationToken;
      } while (continuationToken);
      let arr = [];
      if (allObjects) {
        for (const item of allObjects) {
          if (
            item &&
            (item.Key.endsWith(".mp4") ||
              item.Key.endsWith(".mov") ||
              item.Key.endsWith(".MOV") ||
              item.Key.endsWith(".m3u8"))
          ) {
            const key = item.Key;
            const id = key.substring(
              key.lastIndexOf("/") + 1,
              key.lastIndexOf(".")
            );
            const url = await s3Bucket.getPresignedUrl("yogacourses", key);
            const newUrl = url.replace(
              "yogacourses.s3.us-east-1.amazonaws.com",
              "d3mzqk1fxuwngx.cloudfront.net"
            );
            const getObj = getVideoData.find((e) => e.videoName == id);
            if (getObj) {
              let val = {
                updateId: getObj._id,
                title: getObj.title,
                sortBy: getObj.sortBy,
                url: newUrl,
              };
              arr.push(val);
            }
          }
        }
      }
      return resolve(arr);
    } catch (err) {
      return reject(err);
    }
  });
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
  pipeline.push({
    $lookup: {
      from: "payments",
      localField: "_id",
      foreignField: "studentId",
      as: "paymentDetails",
    },
  });
  pipeline.push({ $unwind: "$paymentDetails" });
  pipeline.push({ $skip: skip }, { $limit: limit });
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
  const result = await studentRepo.getStudentDataFilter(facetPipeline);
  studentList = result[0].data;
  const totalData =
    result[0].totalCount.length > 0 ? result[0].totalCount[0].total : 0;

  return { studentList, totalData };
};
let getPranaArmbhAllData = async function (
  courseId,
  skip,
  limit,
  searchText,
  paymentStatus
) {
  let studentList;
  let pipeline = [
    {
      $match: {
        course: courseId,
        paymentCourseId: constants.COURSE.PRANA_ARAMBHA,
      },
    },
    { $sort: { created: -1 } },
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
  pipeline.push({
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
  });
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
let getBrathDtoxAllData = async function (
  courseId,
  skip,
  limit,
  searchText,
  fromDate,
  toDate
) {
  let studentList;
  let matchStage = { course: courseId };

  if (fromDate && toDate) {
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
  const totalData = await getBrathDtoxCount(
    courseId,
    searchText,
    fromDate,
    toDate
  );
  return { studentList, totalData };
};
let getBrathDtoxCount = async function (
  courseId,
  searchText,
  fromDate,
  toDate
) {
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
