"use strict";
const studentRepo = require("../repositories/studentRepository");
const constants = require("../helpers/constants.json");
const paymentRepo = require("../repositories/paymentRepository");
const s3Bucket = require("../services/s3_bucket");
const helper = require("../helpers/helper");
const sendMail = require("../helpers/nodemail");

module.exports = {
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
        const month = reqBody.month ? reqBody.month : null;
        const filterCondition = {
          "courses.id": +reqBody.teacherId,
          ...(searchText && {
            $or: [
              { name: { $regex: searchText, $options: "i" } },
              { email: { $regex: searchText, $options: "i" } },
            ],
          }),
          ...(reqBody.paymentType && {
            paymentType: reqBody.paymentType,
          }),
          ...(reqBody.paymentStatus && {
            paymentStatus: reqBody.paymentStatus,
          }),
          ...(month && { month: month }),
        };
        let pipeLine = [
          { $sort: { created: -1 } },
          { $match: filterCondition },
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
          { $match: filterCondition },
          { $count: "total" },
        ];
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
              month: "$month",
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
        if (reqBody.month) {
          pipeLine.splice(0, 0, {
            $match: {
              month: reqBody.month,
            },
          });
          pipeLineCount.splice(0, 0, {
            $match: {
              month: reqBody.month,
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
        let size = reqBody.size || 10;
        let pageNo = reqBody.pageNo || 1;
        let searchText = reqBody.searchText;
        const skip = Number(size * (pageNo - 1));
        const limit = Number(size) || 0;
        const filterCondition = {
          ...(searchText && {
            $or: [
              { firstName: { $regex: searchText, $options: "i" } },
              { lastName: { $regex: searchText, $options: "i" } },
              { email: { $regex: searchText, $options: "i" } },
            ],
          }),
        };
        const fosData = await studentRepo.getFosStudentList(
          filterCondition,
          skip,
          limit
        );
        return resolve({
          studentList: fosData.data,
          totalStudent: fosData.totalRecords,
        });
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
        const filterCondition = {
          ...(searchText && {
            $or: [
              { name: { $regex: searchText, $options: "i" } },
              { email: { $regex: searchText, $options: "i" } },
              { phoneNumber: { $regex: searchText, $options: "i" } },
              { address: { $regex: searchText, $options: "i" } },
              { couponcode: { $regex: searchText, $options: "i" } },
            ],
          }),
          ...(reqBody.paymentStatus && {
            $and: [{ paymentStatus: reqBody.paymentStatus }],
          }),
          ...(reqBody.month && {
            $and: [{ month: reqBody.month }],
          }),
        };
        let pipeLine = [
          { $match: filterCondition },
          {
            $lookup: {
              from: "couponcodes",
              localField: "_id",
              foreignField: "studentId",
              as: "couponData",
            },
          },
          {
            $unwind: {
              path: "$couponData",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              _id: 1,
              name: 1,
              email: 1,
              phoneNumber: 1,
              address: 1,
              currency: 1,
              price: 1,
              paymentStatus: 1,
              created: 1,
              couponcode: "$couponData.code",
              couponUsed: "$couponData.isUsed",
              paymentType: 1,
              month: 1,
            },
          },
          { $sort: { created: -1 } },
          {
            $facet: {
              metadata: [{ $count: "total" }],
              data: reqBody.isGetAll
                ? []
                : [{ $skip: skip }, { $limit: limit }],
            },
          },
        ];
        let allData = await studentRepo.getPranicPurificationData(pipeLine);
        return resolve({
          studentList: allData[0].data,
          studentTotal:
            allData[0].metadata && allData[0].metadata.length == 1
              ? allData[0].metadata[0].total
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
        let pipeLine = [
          {
            $project: {
              _id: 1,
              name: 1,
              email: 1,
              phoneNumber: 1,
              price: 1,
              currency: 1,
              paymentStatus: 1,
              paymentType: 1,
              created: 1,
              month: 1,
            },
          },
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
        if (reqBody.month) {
          const monthMatch = { month: reqBody.month };
          pipeLine.splice(1, 0, { $match: monthMatch });
          pipeLineCount.splice(1, 0, { $match: monthMatch });
        }
        pipeLine.push({ $sort: { created: -1 } });
        pipeLine.push({
          $facet: {
            metadata: [{ $count: "total" }],
            // data: isGetAll ? [] : [{ $skip: skip }, { $limit: limit }],
            data: [{ $skip: skip }, { $limit: limit }],
          },
        });
        let allData = await studentRepo.get200ttcData(pipeLine);
        return resolve({
          studentList: allData[0].data,
          studentTotal:
            allData[0].metadata[0] && allData[0].metadata.length > 0
              ? allData[0].metadata[0].total
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
  getRishikeshData: function (reqBody) {
    return new Promise(async (resolve, reject) => {
      try {
        const {
          pageNo = 1,
          size = 10,
          searchText = "",
          paymentStatus = "",
          courseType,
          month
        } = reqBody;
        const validPageNo = Math.max(1, parseInt(pageNo) || 1);
        const validSize = Math.max(1, parseInt(size) || 10);
        const skip = validSize * (validPageNo - 1);
        const filter = {};
        if (searchText && searchText.trim()) {
          filter.$or = [
            { name: { $regex: searchText, $options: "i" } },
            { email: { $regex: searchText, $options: "i" } },
            { phoneNumber: { $regex: searchText, $options: "i" } },
          ];
        }
        if (paymentStatus && paymentStatus.trim()) {
          filter.paymentStatus = paymentStatus.toLowerCase();
        }
        if (month) {
          filter.month = month;
        }
        if (
          courseType !== undefined &&
          courseType !== null &&
          String(courseType).trim() !== ""
        ) {
          const hourValue = Number(courseType);
          if (!isNaN(hourValue)) {
            filter.hour = hourValue;
          } else {
            filter.hour = courseType;
          }
        }
        const result = await studentRepo.getRishikeshDataWithFilters(
          filter,
          skip,
          validSize
        );
        return resolve({
          studentList: result.data,
          studentTotal: result.totalRecords || 0,
        });
      } catch (error) {
        return reject(error);
      }
    });
  },
  get24HoursPranicPurificationMailAfterPayment: async function () {
    try {
      const now = new Date();

      const targetTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const startTime = new Date(targetTime.getTime() - 5 * 60 * 1000);
      const endTime = new Date(targetTime.getTime() + 5 * 60 * 1000);

      const pranicData = await studentRepo.get24HoursPranicPurificationData(
        startTime,
        endTime
      );

      for (let student of pranicData) {
        try {
          await helper.get24HoursPranicPurificationMailAfterPaymentEmail(
            student
          );
          await studentRepo.updatePranicPurificationMailStatus(student._id);
        } catch (loopErr) {
          console.error("Error Processing Student:", student.email, loopErr);
        }
      }
      return 1;
    } catch (err) {
      console.error("CRON MAIN ERROR:", err);
      throw err;
    }
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
      var params = {
        Bucket: "yogacourses",
        Prefix: `upCourses/${reqBody.courseId}/`,
        Delimiter: "/",
      };
      let continuationToken = null;
      let allObjects = [];
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
