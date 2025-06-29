"use strict";
const pranicPurificationUsers = require("../models/pranicPurificationUsersModel");
const couponCourse = require("../models/couponCodeModel");
const paymentModel = require("../models/paymentModel");
const twoHundredHourTTCModel = require("../models/twoHundredHourTTCModel");

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
          { paymentStatus: "failed" }
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
function updatePranaArambhPaymentUserData(
  payDbId,
  razorpay_payment_id,
  amount,
  currency
) {
  return new Promise(async (resolve, reject) => {
    try {
      await paymentModel.findOneAndUpdate(
        { _id: payDbId },
        {
          paymentId: razorpay_payment_id,
          amount: amount,
          currency: currency,
          paymentStatus: "paid",
        }
      );
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
function update200TTCata(id, paymentId, isPaid) {
  return new Promise(async (resolve, reject) => {
    try {
      let user;
      if (isPaid) {
        user = await twoHundredHourTTCModel.findOneAndUpdate(
          { _id: id },
          {
            paymentId: paymentId,
            paymentStatus: "paid",
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
  getCoupondataById
};
