"use strict";
const pranicPurificationUsers = require("../models/pranicPurificationUsersModel");
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
module.exports = {
  getAllPendingPaymentList,
};
