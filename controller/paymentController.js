"use strict";
const paymentService = require("../services/paymentService");
async function getPaymentDetailsById(req, res) {
  try {
    let result = await paymentService.getPaymentDetailsById(req.body.id);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ msg: err });
  }
}
module.exports = { getPaymentDetailsById };
