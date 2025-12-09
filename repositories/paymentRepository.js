"use strict";
const pranicPurificationUsers = require("../models/pranicPurificationUsersModel");
const couponCourse = require("../models/couponCodeModel");
const paymentModel = require("../models/paymentModel");
const twoHundredHourTTCModel = require("../models/twoHundredHourTTCModel");
const rishikeshStudentModel = require("../models/rishikeshStudent");
const webinerUserModel = require("../models/webinarRegiserUserModel");
const liveCoursesCustomerModel = require("../models/liveCoursesCustomerModel");
const baliStudentModel = require("../models/baliStudent");
const constant = require("../helpers/constants.json");

function createPranicUserData(userData) {
  return new Promise(async (resolve, reject) => {
    try {
      const data = await pranicPurificationUsers.create(userData);
      return resolve(data);
    } catch (error) {
      return reject(error);
    }
  });
}
function updatePranicUserData(id, paymentId, isPaid) {
  return new Promise(async (resolve, reject) => {
    try {
      let user;
      if (isPaid) {
        user = await pranicPurificationUsers.findOneAndUpdate(
          { _id: id },
          {
            paymentId: paymentId,
            paymentStatus: "paid",
          },
          { new: true }
        );
      } else {
        await pranicPurificationUsers.findOneAndUpdate(
          { _id: id },
          { paymentStatus: constant.PAYMENT_STATUS.PENDING }
        );
      }
      return resolve(user);
    } catch (error) {
      return reject(error);
    }
  });
}
function createCouponCodeData(userData) {
  return new Promise(async (resolve, reject) => {
    try {
      const data = await couponCourse.create(userData);
      return resolve(data);
    } catch (error) {
      return reject(error);
    }
  });
}
function getCouponByEmail(data) {
  return new Promise(async (resolve, reject) => {
    try {
      const resultData = await couponCourse
        .findOne(data, { code: 1 })
        .sort({ created: -1 });
      return resolve(resultData);
    } catch (error) {
      return reject(error);
    }
  });
}
function updatePranaArambhPaymentUserData(payDbId, data) {
  return new Promise(async (resolve, reject) => {
    try {
      await paymentModel.findOneAndUpdate({ _id: payDbId }, data);
      return resolve(1);
    } catch (error) {
      return reject(error);
    }
  });
}
function getPaymentDetailsById(id) {
  return new Promise(async (resolve, reject) => {
    try {
      const resultData = await paymentModel.findOne({ _id: id });
      return resolve(resultData);
    } catch (error) {
      return reject(error);
    }
  });
}
function disableCouponCode(id) {
  return new Promise(async (resolve, reject) => {
    try {
      await couponCourse.findOneAndUpdate(
        { _id: id },
        {
          isUsed: true,
        }
      );
      return resolve(1);
    } catch (error) {
      return reject(error);
    }
  });
}
function create200TTCData(userData) {
  return new Promise(async (resolve, reject) => {
    try {
      const data = await twoHundredHourTTCModel.create(userData);
      return resolve(data);
    } catch (error) {
      return reject(error);
    }
  });
}
function update200TTCata(id, paymentId, isPaid, installment, due) {
  return new Promise(async (resolve, reject) => {
    try {
      let user;
      if (isPaid) {
        user = await twoHundredHourTTCModel.findOneAndUpdate(
          { _id: id },
          {
            paymentId: paymentId,
            paymentStatus: "paid",
            installment: installment,
            dueAmount: due,
          },
          { new: true }
        );
      } else {
        await twoHundredHourTTCModel.findOneAndUpdate(
          { _id: id },
          { paymentStatus: "failed" }
        );
      }
      return resolve(user);
    } catch (error) {
      return reject(error);
    }
  });
}
function getCoupondataById(data) {
  return new Promise(async (resolve, reject) => {
    try {
      const resultData = await couponCourse.findOne(data);
      return resolve(resultData);
    } catch (error) {
      return reject(error);
    }
  });
}
function createPaymentDetails(data) {
  return new Promise(async (resolve, reject) => {
    try {
      data = await paymentModel.create(data);
      return resolve(data);
    } catch (error) {
      return reject(error);
    }
  });
}
function secondInstallmentPaymentMail(startDate, endDate) {
  return new Promise(async (resolve, reject) => {
    try {
      const data = await twoHundredHourTTCModel
        .find({
          created: {
            $gte: startDate,
            $lte: endDate,
          },
          dueAmount: { $ne: 0 },
        })
        .lean();
      return resolve(data);
    } catch (error) {
      return reject(error);
    }
  });
}
function getPaymentDetailsById(id) {
  return new Promise(async (resolve, reject) => {
    try {
      const data = await twoHundredHourTTCModel.findById(id).lean();
      return resolve(data);
    } catch (error) {
      return reject(error);
    }
  });
}
function updateInstallmentPayment200TTCata(id, due) {
  return new Promise(async (resolve, reject) => {
    try {
      let data = await twoHundredHourTTCModel.findById(id);
      await twoHundredHourTTCModel.findOneAndUpdate(
        { _id: id },
        {
          price: +data.price + due,
          dueAmount: 0,
        }
      );
      return resolve(data);
    } catch (error) {
      return reject(error);
    }
  });
}
function createRishikeshData(userData) {
  return new Promise(async (resolve, reject) => {
    try {
      const data = await rishikeshStudentModel.create(userData);
      return resolve(data);
    } catch (error) {
      return reject(error);
    }
  });
}
function updateRishikeshStudentData(id, paymentId, isPaid) {
  return new Promise(async (resolve, reject) => {
    try {
      let user;
      if (isPaid) {
        user = await rishikeshStudentModel.findOneAndUpdate(
          { _id: id },
          {
            paymentId: paymentId,
            paymentStatus: "paid",
          },
          { new: true }
        );
      } else {
        await rishikeshStudentModel.findOneAndUpdate(
          { _id: id },
          { paymentStatus: "pending" }
        );
      }
      return resolve(user);
    } catch (error) {
      return reject(error);
    }
  });
}
function update200ttcPayment(data, id) {
  return new Promise(async (resolve, reject) => {
    try {
      await twoHundredHourTTCModel.findOneAndUpdate({ _id: id }, data);
      return resolve(1);
    } catch (error) {
      return reject(error);
    }
  });
}
function updatePaymentStatusForcefully(startDate, endDate) {
  return new Promise(async (resolve, reject) => {
    try {
      const data = await twoHundredHourTTCModel
        .find({
          created: {
            $gte: startDate,
            $lte: endDate,
          },
          paymentStatus: { $ne: "paid" },
          isPaymentCheck: false,
        })
        .lean();
      return resolve(data);
    } catch (error) {
      return reject(error);
    }
  });
}
function webinnerUpdateById(id, data) {
  return new Promise(async (resolve, reject) => {
    try {
      const pay = await webinerUserModel.findOneAndUpdate({ _id: id }, data);
      return resolve(pay);
    } catch (error) {
      return reject(error);
    }
  });
}
function updateSwaraSadhanaPaymentStatusForcefully(startDate, endDate) {
  return new Promise(async (resolve, reject) => {
    try {
      const data = await webinerUserModel
        .find({
          created: {
            $gte: startDate,
            $lte: endDate,
          },
          paymentStatus: { $ne: "paid" },
          isPaymentCheck: false,
        })
        .lean();
      return resolve(data);
    } catch (error) {
      return reject(error);
    }
  });
}
function liveCourseUpdateById(id, data) {
  return new Promise(async (resolve, reject) => {
    try {
      const pay = await liveCoursesCustomerModel.findOneAndUpdate(
        { _id: id },
        data
      );
      return resolve(pay);
    } catch (error) {
      return reject(error);
    }
  });
}
function updateOnlineSadhanaPaymentStatusForcefully(startDate, endDate) {
  return new Promise(async (resolve, reject) => {
    try {
      const data = await liveCoursesCustomerModel
        .find({
          created: {
            $gte: startDate,
            $lte: endDate,
          },
          paymentStatus: { $ne: "paid" },
          isPaymentCheck: false,
        })
        .lean();
      return resolve(data);
    } catch (error) {
      return reject(error);
    }
  });
}
function updatePranaArambhPaymentStatusForcefully(startDate, endDate) {
  return new Promise(async (resolve, reject) => {
    try {
      const data = await paymentModel
        .find({
          created: {
            $gte: startDate,
            $lte: endDate,
          },
          paymentStatus: { $ne: "paid" },
          isPaymentCheck: false,
        })
        .lean();
      return resolve(data);
    } catch (error) {
      return reject(error);
    }
  });
}
function updatePranicPurificationStatusForcefully(startDate, endDate) {
  return new Promise(async (resolve, reject) => {
    try {
      const data = await pranicPurificationUsers
        .find({
          created: {
            $gte: startDate,
            $lte: endDate,
          },
          paymentStatus: { $ne: "paid" },
          isPaymentCheck: false,
        })
        .lean();
      return resolve(data);
    } catch (error) {
      return reject(error);
    }
  });
}
function pranicPurificationUpdateById(id, data) {
  return new Promise(async (resolve, reject) => {
    try {
      const pay = await pranicPurificationUsers.findOneAndUpdate(
        { _id: id },
        data
      );
      return resolve(pay);
    } catch (error) {
      return reject(error);
    }
  });
}
function rishikeshUpdateById(id, data) {
  return new Promise(async (resolve, reject) => {
    try {
      const pay = await rishikeshStudentModel.findOneAndUpdate(
        { _id: id },
        data
      );
      return resolve(pay);
    } catch (error) {
      return reject(error);
    }
  });
}
function updateRishikeshStatusForcefully(startDate, endDate) {
  return new Promise(async (resolve, reject) => {
    try {
      const data = await rishikeshStudentModel
        .find({
          created: {
            $gte: startDate,
            $lte: endDate,
          },
          paymentStatus: { $ne: "paid" },
          isPaymentCheck: false,
        })
        .lean();
      return resolve(data);
    } catch (error) {
      return reject(error);
    }
  });
}
function createBaliData(userData) {
  return new Promise(async (resolve, reject) => {
    try {
      const data = await baliStudentModel.create(userData);
      return resolve(data);
    } catch (error) {
      return reject(error);
    }
  });
}
function baliUpdateById(id, data) {
  return new Promise(async (resolve, reject) => {
    try {
      const pay = await baliStudentModel.findOneAndUpdate({ _id: id }, data);
      return resolve(pay);
    } catch (error) {
      return reject(error);
    }
  });
}
function updateBaliStudentData(id, paymentId, isPaid) {
  return new Promise(async (resolve, reject) => {
    try {
      let user;
      if (isPaid) {
        user = await baliStudentModel.findOneAndUpdate(
          { _id: id },
          {
            paymentId: paymentId,
            paymentStatus: "paid",
          },
          { new: true }
        );
      } else {
        await baliStudentModel.findOneAndUpdate(
          { _id: id },
          { paymentStatus: "pending" }
        );
      }
      return resolve(user);
    } catch (error) {
      return reject(error);
    }
  });
}
module.exports = {
  createPranicUserData,
  updatePranicUserData,
  createCouponCodeData,
  getCouponByEmail,
  updatePranaArambhPaymentUserData,
  getPaymentDetailsById,
  disableCouponCode,
  create200TTCData,
  update200TTCata,
  getCoupondataById,
  createPaymentDetails,
  secondInstallmentPaymentMail,
  updateInstallmentPayment200TTCata,
  createRishikeshData,
  updateRishikeshStudentData,
  update200ttcPayment,
  updatePaymentStatusForcefully,
  webinnerUpdateById,
  updateSwaraSadhanaPaymentStatusForcefully,
  liveCourseUpdateById,
  updateOnlineSadhanaPaymentStatusForcefully,
  updatePranaArambhPaymentStatusForcefully,
  updatePranicPurificationStatusForcefully,
  pranicPurificationUpdateById,
  rishikeshUpdateById,
  updateRishikeshStatusForcefully,
  createBaliData,
  baliUpdateById,
  updateBaliStudentData,
};
