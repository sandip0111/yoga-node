"use strict";
const studentRepo = require("../repositories/studentRepository");
const courseRepo = require("../repositories/courseRepository");
const helper = require("../helpers/helper");
const constant = require("../helpers/constants.json");
const liveCoursesCustomermodel = require("../models/liveCoursesCustomerModel");
const paymentRepo = require("../repositories/paymentRepository");
const paymentModel = require("../models/paymentModel");
const adminRepo = require("../repositories/adminRepository");
const course = require("../models/courseModel");
const paymentService = require("./paymentService");
function registerSwarSadhanaWebinarUser(reqBody) {
  return new Promise(async (resolve, reject) => {
    try {
      var {
        name,
        email,
        phone,
        city,
        company,
        webinar,
        timeSlot,
        password,
        isWebsite,
        paymentType,
      } = reqBody;
      let created = new Date();
      if (timeSlot) {
        const errMsg = await courseRepo.checkCourseTimeSlot(timeSlot);
        if (errMsg) {
          return resolve({
            data: { error: errMsg },
            status: 400,
          });
        }
      }
      var paymentStatus = "";
      if (isWebsite) {
        paymentStatus = constant.PAYMENT_STATUS.PENDING;
      } else {
        paymentType = "paypal";
        paymentStatus = constant.PAYMENT_STATUS.PAID;
        isWebsite = false;
      }
      const savedUser = await studentRepo.registerSwaraSadhanaStudentByAdmin({
        name,
        email,
        phone,
        city,
        company,
        webinar,
        timeSlot,
        password,
        created,
        paymentStatus,
        paymentType,
      });
      if (!isWebsite) {
        await helper.sendSwaraSadhnaEmail(
          {
            name: name,
            webinar: webinar,
            email: email,
            password: password,
          },
          email
        );
      }
      return resolve({
        data: {
          status: "ok",
          message: "User registered successfully!",
          userId: savedUser._id,
        },
        status: 200,
      });
    } catch (error) {
      reject(error);
    }
  });
}
function registerPranicPurificationUser(reqBody) {
  return new Promise(async (resolve, reject) => {
    try {
      const savedUser =
        await studentRepo.registerPranicPurificationStudentByAdmin({
          name: reqBody.name,
          email: reqBody.email,
          paymentStatus: constant.PAYMENT_STATUS.PAID,
          paymentType: "paypal",
        });
      const password = helper.genratePass(6);
      await paymentService.createPranicPurificationStudent(savedUser, password);
      await helper.completePranicPurificationAutomationEmail(
        savedUser,
        password
      );
      return resolve({
        data: {
          status: "ok",
          message: "User registered successfully!",
          userId: savedUser._id,
        },
        status: 200,
      });
    } catch (error) {
      reject(error);
    }
  });
}
function register200TTCUser(reqBody) {
  return new Promise(async (resolve, reject) => {
    try {
      const savedUser = await studentRepo.register200TTCStudentByAdmin({
        name: reqBody.name,
        email: reqBody.email,
        phoneNumber: reqBody.phone,
        paymentStatus: constant.PAYMENT_STATUS.PAID,
        created: new Date(),
        paymentType: "paypal",
      });
      await helper.send200TTCEmail(savedUser);
      return resolve({
        data: {
          status: "ok",
          message: "User registered successfully!",
          userId: savedUser._id,
        },
        status: 200,
      });
    } catch (error) {
      reject(error);
    }
  });
}
function createLiveCourseCustomer(reqBody, mentors) {
  return new Promise(async (resolve, reject) => {
    try {
      const paymentData = {
        name: reqBody.name,
        email: reqBody.email,
        paymentStatus: "paid",
        courses: reqBody.course,
        paymentType: "paypal",
        month: reqBody.month,
      };
      const onlineData = await liveCoursesCustomermodel.create(paymentData);
      await studentRepo.createStudent({
        firstName: reqBody.name,
        email: reqBody.email,
        isActive: true,
        password: reqBody.password,
        paymentCourseId: constant.COURSE.ONLINE_LIVE_CLASSES,
        course: reqBody.course,
        source: `onlineSadhana_${onlineData._id}_${onlineData.month}`,
      });
      for (let coursObj of reqBody.courseList) {
        // const mentors = await courseRepo.getCourseBySlug("online-yoga-classes");
        var item = coursObj;
        if (item) {
          await helper.onlineSadhanaClassSendMail(
            reqBody.name,
            reqBody.email,
            item,
            reqBody.password
          );
        }
      }
      return resolve({
        data: {
          status: "ok",
          message: "User registered successfully!",
        },
        status: 200,
      });
    } catch (error) {
      reject(error);
    }
  });
}
function createFreeWebinarCustomer(reqBody) {
  return new Promise(async (resolve, reject) => {
    try {
      const customerData = {
        name: reqBody.name,
        email: reqBody.email,
        webinarDate: reqBody.webinarDate,
      };
      await courseRepo.createFreeWebinarCustomer(customerData);
      const savedUser = {
        name: reqBody.name,
        email: reqBody.email,
        subject:
          "Your spot is confirmed – “Sadhana to Seva” Webinar Access Inside",
      };
      await helper.sendFreeWebinarConfirmationEmail(savedUser);
      return resolve({
        data: {
          status: "ok",
          message: "User registered successfully!",
        },
        status: 200,
      });
    } catch (error) {
      reject(error);
    }
  });
}
function createRishikeshCustomer(reqBody) {
  return new Promise(async (resolve, reject) => {
    try {
      const paymentData = {
        name: reqBody.name,
        email: reqBody.email,
        phone: reqBody.phone,
        hour: reqBody.hour,
        paymentStatus: "paid",
        paymentType: "paypal",
        month: reqBody.month,
      };
      await paymentRepo.createRishikeshData(paymentData);
      await helper.sendRishikeshCourseEmail(reqBody);
      return resolve({
        data: {
          status: "ok",
          message: "User registered successfully!",
        },
        status: 200,
      });
    } catch (error) {
      reject(error);
    }
  });
}
function createPranaArambhCustomer(reqBody) {
  return new Promise(async (resolve, reject) => {
    try {
      const student = await studentRepo.createStudent({
        firstName: reqBody.name,
        email: reqBody.email,
        password: reqBody.password,
        course: ["644f9dfc499ffcfb45df35cd"],
        isActive: true,
      });
      const paymentData = {
        courseId: "644f9dfc499ffcfb45df35cd",
        studentId: student._id,
        paymentStatus: "paid",
        paymentBy: "Paypal",
      };
      await paymentModel.create(paymentData);
      let coursetitle = await courseRepo.getCourseById(
        "644f9dfc499ffcfb45df35cd"
      );
      let date = new Date();
      let replacement = {
        name: reqBody.name,
        course: coursetitle,
        email: reqBody.email,
        date: date.toString(),
        password: reqBody.password,
      };
      await helper.sendPranaArambhEmail(replacement);
      return resolve({
        data: {
          status: "ok",
          message: "User registered successfully!",
        },
        status: 200,
      });
    } catch (error) {
      reject(error);
    }
  });
}
function sendBulkMailFreeWebiner() {
  return new Promise(async (resolve, reject) => {
    try {
      const customerData = {
        isAdminMailSend: false,
        // email: "kaushik.das.mca18@gmail.com",
      };
      let data = await courseRepo.getFreeWebinarCustomer(customerData);
      for (let obj of data) {
        await helper.sendBulkFreeWebinerMail(obj.email);
        await courseRepo.updateFreeWebinarCustomer(obj._id, {
          isAdminMailSend: true,
        });
        await new Promise((resolve) => setTimeout(resolve, 10000));
      }
      let msg;
      if (data.length > 0) {
        msg = "Email send succesfully";
      } else {
        msg = "No new user exist";
      }
      return resolve({
        data: {
          status: "ok",
          message: msg,
        },
        status: 200,
      });
    } catch (error) {
      reject(error);
    }
  });
}
function getAllParayanamStudent(reqBody) {
  return new Promise(async (resolve, reject) => {
    try {
      let courseId = constant.COURSE.PRANA_ARAMBHA;
      let size = reqBody.size || 10;
      let pageNo = reqBody.pageNo || 1;
      let searchText = reqBody.searchText;
      const skip = Number(size * (pageNo - 1));
      const limit = Number(size) || 0;
      let studentObj;
      let studentList;
      let totalStudent = 0;
      studentObj = await getPranaArmbhAllData(
        courseId,
        skip,
        limit,
        searchText,
        reqBody.paymentStatus,
        reqBody.isGetAll
      );
      studentList = studentObj.studentList;
      totalStudent = studentObj.totalData;
      return resolve({
        totalStudent,
        studentList,
      });
    } catch (error) {
      return reject(error);
    }
  });
}
let getPranaArmbhAllData = async function (
  courseId,
  skip,
  limit,
  searchText,
  paymentStatus,
  isGetAll
) {
  try {
    let pipeLine = [];
    if (searchText || paymentStatus) {
      if (searchText && !paymentStatus) {
        pipeLine = [
          {
            $lookup: {
              from: "students",
              localField: "studentId",
              foreignField: "_id",
              as: "studentInfo",
              pipeline: [
                {
                  $match: {
                    paymentCourseId: courseId,
                    $or: [
                      { firstName: { $regex: searchText, $options: "i" } },
                      { email: { $regex: searchText, $options: "i" } },
                    ],
                  },
                },
              ],
            },
          },
        ];
      } else if (paymentStatus && !searchText) {
        pipeLine = [
          { $match: { paymentStatus: paymentStatus } },
          {
            $lookup: {
              from: "students",
              localField: "studentId",
              foreignField: "_id",
              as: "studentInfo",
              pipeline: [
                {
                  $match: {
                    paymentCourseId: courseId,
                  },
                },
              ],
            },
          },
        ];
      } else if (paymentStatus && searchText) {
        pipeLine = [
          { $match: { paymentStatus: paymentStatus } },
          {
            $lookup: {
              from: "students",
              localField: "studentId",
              foreignField: "_id",
              as: "studentInfo",
              pipeline: [
                {
                  $match: {
                    paymentCourseId: courseId,
                    $or: [
                      { firstName: { $regex: searchText, $options: "i" } },
                      { email: { $regex: searchText, $options: "i" } },
                    ],
                  },
                },
              ],
            },
          },
        ];
      }
    } else {
      pipeLine = [
        {
          $lookup: {
            from: "students",
            localField: "studentId",
            foreignField: "_id",
            as: "studentInfo",
            pipeline: [
              {
                $match: {
                  paymentCourseId: courseId,
                },
              },
            ],
          },
        },
      ];
    }
    pipeLine.push({
      $unwind: {
        path: "$studentInfo",
        preserveNullAndEmptyArrays: false,
      },
    });
    pipeLine.push({ $sort: { created: -1 } });
    pipeLine.push({
      $facet: {
        metadata: [{ $count: "total" }],
        data: isGetAll ? [] : [{ $skip: skip }, { $limit: limit }],
      },
    });
    let data = await adminRepo.getAllPranaArambhList(pipeLine);
    const studentList = data[0].data;
    const totalData =
      data[0].metadata.length > 0 ? data[0].metadata[0].total : 0;
    return { studentList, totalData };
  } catch (err) {
    console.log(err);
  }
};
function getAllPendingPaymentList(reqBody) {
  return new Promise(async (resolve, reject) => {
    try {
      let size = reqBody.size || 10;
      let pageNo = reqBody.pageNo || 1;
      const skip = Number(size * (pageNo - 1));
      const limit = Number(size) || 0;
      let allData;
      let pipeLine;
      switch (reqBody.course) {
        case constant.COURSE.PRANA_ARAMBHA:
          pipeLine = getAllPranaArambhPipeLine(skip, limit);
          allData = await adminRepo.getAllPranaArambhList(pipeLine);
          break;
        case constant.COURSE.SWAR_SADHNA:
          pipeLine = getAllSwaraSadhanaPipeLine(skip, limit);
          allData = await adminRepo.getAllSwaraSadhanaList(pipeLine);
          break;
        case constant.COURSE.PRANIC_PURIFICATION:
          pipeLine = getAllPranicPurificationPipeLine(skip, limit);
          allData = await adminRepo.getAllPendingPaymentList(pipeLine);
          break;
        case constant.COURSE.TWO_THOUSANDS_TTC:
          pipeLine = getAllTwoHunTTCPipeLine(skip, limit);
          allData = await adminRepo.getAllTwoHunTTCList(pipeLine);
          break;
        case constant.COURSE.ONLINE_LIVE_CLASSES:
          pipeLine = getAllOnlineLiveClassPipeLine(skip, limit);
          allData = await adminRepo.getAllOnlineLiveClassList(pipeLine);
          break;
        case constant.COURSE.RISHIKESH_100_HOURS:
          pipeLine = getAllRishikeshPipeLine(skip, limit, 100);
          allData = await adminRepo.getAllRishikeshList(pipeLine);
          break;
        case constant.COURSE.RISHIKESH_200_HOURS:
          pipeLine = getAllRishikeshPipeLine(skip, limit, 200);
          allData = await adminRepo.getAllRishikeshList(pipeLine);
          break;
        case constant.COURSE.RISHIKESH_300_HOURS:
          pipeLine = getAllRishikeshPipeLine(skip, limit, 300);
          allData = await adminRepo.getAllRishikeshList(pipeLine);
          break;
        default:
          pipeLine = getAllPendingPaymentPipeLine(skip, limit);
          allData = await adminRepo.getAllPendingPaymentList(pipeLine);
          break;
      }
      return resolve(allData);
    } catch (error) {
      reject(error);
    }
  });
}
function getAllPranaArambhPipeLine(skip, limit) {
  return [
    { $match: { paymentStatus: { $ne: "paid" } } },
    {
      $lookup: {
        from: "students",
        localField: "studentId",
        foreignField: "_id",
        as: "studentInfo",
        pipeline: [
          {
            $match: {
              paymentCourseId: constant.COURSE.PRANA_ARAMBHA,
            },
          },
        ],
      },
    },
    {
      $unwind: {
        path: "$studentInfo",
        preserveNullAndEmptyArrays: false,
      },
    },
    {
      $project: {
        _id: 1,
        paymentStatus: 1,
        created: 1,
        courseName: "Prana Arambh",
        name: "$studentInfo.firstName",
        email: "$studentInfo.email",
        month: 1,
        paymentType: "$paymentBy",
      },
    },
    { $sort: { created: -1 } },
    {
      $facet: {
        metadata: [{ $count: "total" }],
        data: [{ $skip: skip }, { $limit: limit }],
      },
    },
  ];
}
function getAllSwaraSadhanaPipeLine(skip, limit) {
  return [
    {
      $match: {
        paymentStatus: { $ne: "paid" },
        webinar: "Swara Sadhana",
      },
    },
    {
      $project: {
        _id: 1,
        paymentStatus: 1,
        created: 1,
        courseName: "Swara Sadhana",
        name: 1,
        month: 1,
        email: 1,
        paymentType: 1,
      },
    },
    { $sort: { created: -1 } },
    {
      $facet: {
        metadata: [{ $count: "total" }],
        data: [{ $skip: skip }, { $limit: limit }],
      },
    },
  ];
}
function getAllPranicPurificationPipeLine(skip, limit) {
  return [
    { $match: { paymentStatus: { $ne: "paid" } } },
    {
      $project: {
        _id: 1,
        paymentStatus: 1,
        created: 1,
        courseName: "Pranic purification",
        name: 1,
        email: 1,
        paymentType: 1,
      },
    },
    { $sort: { created: -1 } },
    {
      $facet: {
        metadata: [{ $count: "total" }],
        data: [{ $skip: skip }, { $limit: limit }],
      },
    },
  ];
}
function getAllTwoHunTTCPipeLine(skip, limit) {
  return [
    { $match: { paymentStatus: { $ne: "paid" } } },
    {
      $project: {
        _id: 1,
        paymentStatus: 1,
        created: 1,
        courseName: "200 TTC",
        name: 1,
        month: 1,
        email: 1,
        paymentType: 1,
      },
    },
    { $sort: { created: -1 } },
    {
      $facet: {
        metadata: [{ $count: "total" }],
        data: [{ $skip: skip }, { $limit: limit }],
      },
    },
  ];
}
function getAllOnlineLiveClassPipeLine(skip, limit) {
  return [
    { $match: { paymentStatus: { $ne: "paid" } } },
    {
      $project: {
        _id: 1,
        paymentStatus: 1,
        created: 1,
        courseName: "Online sadhana",
        name: 1,
        month: 1,
        email: 1,
        paymentType: 1,
      },
    },
    { $sort: { created: -1 } },
    {
      $facet: {
        metadata: [{ $count: "total" }],
        data: [{ $skip: skip }, { $limit: limit }],
      },
    },
  ];
}
function getAllRishikeshPipeLine(skip, limit, hour) {
  return [
    { $match: { paymentStatus: { $ne: "paid" }, hour: hour } },
    {
      $project: {
        _id: 1,
        paymentStatus: 1,
        created: 1,
        courseName: {
          $concat: [{ $toString: "$hour" }, " hour ", "Rishikesh"],
        },
        name: 1,
        month: 1,
        email: 1,
        paymentType: 1,
      },
    },
    { $sort: { created: -1 } },
    {
      $facet: {
        metadata: [{ $count: "total" }],
        data: [{ $skip: skip }, { $limit: limit }],
      },
    },
  ];
}
function getAllPendingPaymentPipeLine(skip, limit) {
  return [
    { $match: { paymentStatus: { $ne: "paid" } } },
    {
      $project: {
        _id: 1,
        paymentStatus: 1,
        created: 1,
        courseName: "Pranic purification",
        name: 1,
        email: 1,
        paymentType: 1,
      },
    },
    {
      $unionWith: {
        coll: "webinarregisterusers",
        pipeline: [
          {
            $match: {
              paymentStatus: { $ne: "paid" },
              webinar: "Swara Sadhana",
            },
          },
          {
            $project: {
              _id: 1,
              paymentStatus: 1,
              created: 1,
              courseName: "Swara Sadhana",
              name: 1,
              month: 1,
              email: 1,
              paymentType: 1,
            },
          },
        ],
      },
    },
    {
      $unionWith: {
        coll: "twohundredhourttcmodels",
        pipeline: [
          { $match: { paymentStatus: { $ne: "paid" } } },
          {
            $project: {
              _id: 1,
              paymentStatus: 1,
              created: 1,
              courseName: "200 TTC",
              name: 1,
              month: 1,
              email: 1,
              paymentType: 1,
            },
          },
        ],
      },
    },
    {
      $unionWith: {
        coll: "rishikeshstudentmodels",
        pipeline: [
          { $match: { paymentStatus: { $ne: "paid" } } },
          {
            $project: {
              _id: 1,
              paymentStatus: 1,
              created: 1,
              courseName: {
                $concat: [{ $toString: "$hour" }, " hour ", "Rishikesh"],
              },
              name: 1,
              month: 1,
              email: 1,
              paymentType: 1,
            },
          },
        ],
      },
    },
    {
      $unionWith: {
        coll: "livecoursescustomers",
        pipeline: [
          { $match: { paymentStatus: { $ne: "paid" } } },
          {
            $project: {
              _id: 1,
              paymentStatus: 1,
              created: 1,
              courseName: "Online sadhana",
              name: 1,
              month: 1,
              email: 1,
              paymentType: 1,
            },
          },
        ],
      },
    },
    {
      $unionWith: {
        coll: "payments",
        pipeline: [
          { $match: { paymentStatus: { $ne: "paid" } } },
          {
            $lookup: {
              from: "students",
              localField: "studentId",
              foreignField: "_id",
              as: "studentInfo",
              pipeline: [
                {
                  $match: {
                    paymentCourseId: constant.COURSE.PRANA_ARAMBHA,
                  },
                },
              ],
            },
          },
          {
            $unwind: {
              path: "$studentInfo",
              preserveNullAndEmptyArrays: false,
            },
          },
          {
            $project: {
              _id: 1,
              paymentStatus: 1,
              created: 1,
              courseName: "Prana Arambh",
              name: "$studentInfo.firstName",
              email: "$studentInfo.email",
              month: 1,
              paymentType: "$paymentBy",
            },
          },
        ],
      },
    },
    { $sort: { created: -1 } },
    {
      $facet: {
        metadata: [{ $count: "total" }],
        data: [{ $skip: skip }, { $limit: limit }],
      },
    },
  ];
}
function sendBulkMail200TTC() {
  return new Promise(async (resolve, reject) => {
    try {
      const customerData = {
        isAdminMailSend: false,
        paymentStatus: "paid",
        month: "November, 2026",
        // email: "kaushik.das.mca18@gmail.com",
      };
      let data = await adminRepo.get200TTCList(customerData);
      for (let obj of data) {
        let studentData = await studentRepo.getStudentBy200TTCOnline(
          obj.email,
          obj.name
        );
        if (studentData) {
          await helper.sendBulkMail200TTC(studentData);
          await paymentRepo.update200ttcPayment(
            { isAdminMailSend: true },
            obj._id
          );
        } else {
          let data = await studentRepo.createStudent({
            firstName: obj.name,
            email: obj.email,
            password: helper.genratePass(6),
            isActive: true,
            paymentCourseId: constant.COURSE.TWO_THOUSANDS_TTC,
            is200TTC: true,
            source: "200TTC_id_November, 2026",
            course: [
              constant.COURSE.TWO_THOUSANDS_TTC,
              constant.COURSE.PRANA_ARAMBHA,
              constant.COURSE.BREATCH_DTOX,
            ],
          });
          await helper.sendBulkMail200TTC(data);
          await paymentRepo.update200ttcPayment(
            { isAdminMailSend: true },
            obj._id
          );
        }
        await new Promise((resolve) => setTimeout(resolve, 7000));
      }
      let msg;
      if (data.length > 0) {
        msg = "Email send succesfully";
      } else {
        msg = "No new user exist";
      }
      return resolve({
        data: {
          status: "ok",
          message: msg,
        },
        status: 200,
      });
    } catch (error) {
      reject(error);
    }
  });
}
function giveAccessToUser(reqBody) {
  return new Promise(async (resolve, reject) => {
    try {
      let data = await studentRepo.createStudent({
        firstName: reqBody.name,
        email: reqBody.email,
        password: helper.genratePass(6),
        isActive: true,
        paymentCourseId: constant.COURSE.TWO_THOUSANDS_TTC,
        is200TTC: true,
        source: `200TTC_${reqBody._id}_November, 2026`,
        course: [
          constant.COURSE.TWO_THOUSANDS_TTC,
          constant.COURSE.PRANA_ARAMBHA,
          constant.COURSE.BREATCH_DTOX,
        ],
      });
      await helper.sendBulkMail200TTC(data);
      await paymentRepo.update200ttcPayment(
        { isAdminMailSend: true },
        reqBody._id
      );
      return resolve({
        data: {
          status: "ok",
          message: `Acess is given and mail has been send to ${reqBody.name}`,
        },
        status: 200,
      });
    } catch (error) {
      reject(error);
    }
  });
}
function foundationOfSpiritualitySave(reqBody) {
  return new Promise(async (resolve, reject) => {
    try {
      let paymentData = {
        name: reqBody.name,
        email: reqBody.email,
        paymentStatus: "paid",
        paymentType: "paypal",
      };
      await adminRepo.fosCreateStudent(paymentData);
      return resolve({
        data: {
          status: true,
          message: "Foundation of spirituality registration successful",
        },
        status: 200,
      });
    } catch (error) {
      reject(error);
    }
  });
}
function getAllLiveClassTeacher(reqBody) {
  return new Promise(async (resolve, reject) => {
    try {
      const allTeacher = await courseRepo.getAllLiveClassTeacher();
      return resolve({
        data: {
          status: true,
          data: allTeacher,
        },
        status: 200,
      });
    } catch (error) {
      reject(error);
    }
  });
}
function createBaliCustomer(reqBody) {
  return new Promise(async (resolve, reject) => {
    try {
      const paymentData = {
        name: reqBody.name,
        email: reqBody.email,
        phone: reqBody.phone,
        hour: reqBody.hour,
        paymentStatus: "paid",
        paymentType: "paypal",
        month: reqBody.month,
      };
      await paymentRepo.createBaliData(paymentData);
      await helper.sendBaliCourseEmail(reqBody);
      return resolve({
        data: {
          status: "ok",
          message: "User registered successfully!",
        },
        status: 200,
      });
    } catch (error) {
      reject(error);
    }
  });
}
module.exports = {
  registerSwarSadhanaWebinarUser,
  registerPranicPurificationUser,
  register200TTCUser,
  createLiveCourseCustomer,
  createRishikeshCustomer,
  createPranaArambhCustomer,
  createFreeWebinarCustomer,
  sendBulkMailFreeWebiner,
  getAllPendingPaymentList,
  getAllParayanamStudent,
  sendBulkMail200TTC,
  giveAccessToUser,
  foundationOfSpiritualitySave,
  getAllLiveClassTeacher,
  createBaliCustomer
};
