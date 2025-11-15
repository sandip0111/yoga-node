"use strict";
const pranicPurificationUsers = require("../models/pranicPurificationUsersModel");
const paymentModel = require("../models/paymentModel");
const webinerModel = require("../models/webinarRegiserUserModel");
const twoHundredHourTTCModel = require("../models/twoHundredHourTTCModel");
const livecoursescustomersModel = require("../models/liveCoursesCustomerModel");
const rishikeshstudentmodels = require("../models/rishikeshStudent");
const onlinepaymentModel = require("../models/onlinePaymentModel");
function getAllPendingPaymentList(pipeLine) {
  return new Promise(async (resolve, reject) => {
    try {
      const data = await pranicPurificationUsers.aggregate(pipeLine);
      return resolve(data);
    } catch (error) {
      return reject(error);
    }
  });
}
function getAllPranaArambhList(pipeLine) {
  return new Promise(async (resolve, reject) => {
    try {
      const data = await paymentModel.aggregate(pipeLine);
      return resolve(data);
    } catch (error) {
      return reject(error);
    }
  });
}
function getAllSwaraSadhanaList(pipeLine) {
  return new Promise(async (resolve, reject) => {
    try {
      const data = await webinerModel.aggregate(pipeLine);
      return resolve(data);
    } catch (error) {
      return reject(error);
    }
  });
}
function getAllTwoHunTTCList(pipeLine) {
  return new Promise(async (resolve, reject) => {
    try {
      const data = await twoHundredHourTTCModel.aggregate(pipeLine);
      return resolve(data);
    } catch (error) {
      return reject(error);
    }
  });
}
function getAllOnlineLiveClassList(pipeLine) {
  return new Promise(async (resolve, reject) => {
    try {
      const data = await livecoursescustomersModel.aggregate(pipeLine);
      return resolve(data);
    } catch (error) {
      return reject(error);
    }
  });
}
function getAllRishikeshList(pipeLine) {
  return new Promise(async (resolve, reject) => {
    try {
      const data = await rishikeshstudentmodels.aggregate(pipeLine);
      return resolve(data);
    } catch (error) {
      return reject(error);
    }
  });
}
function get200TTCList(obj) {
  return new Promise(async (resolve, reject) => {
    try {
      const data = await twoHundredHourTTCModel.find(obj);
      return resolve(data);
    } catch (error) {
      return reject(error);
    }
  });
}
function fosCreateStudent(obj) {
  return new Promise(async (resolve, reject) => {
    try {
      const data = await onlinepaymentModel.create(obj);
      return resolve(data);
    } catch (error) {
      return reject(error);
    }
  });
}
module.exports = {
  getAllPendingPaymentList,
  getAllPranaArambhList,
  getAllSwaraSadhanaList,
  getAllTwoHunTTCList,
  getAllOnlineLiveClassList,
  getAllRishikeshList,
  get200TTCList,
  fosCreateStudent
};
