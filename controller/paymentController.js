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
async function checkoutStripeForRishikesh(req, res) {
  try {
    let result = await paymentService.checkoutStripeForRishikesh(req.body);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json(error);
  }
}
async function getStripePaymentResultRishikesh(req, res) {
  try {
    let result = await paymentService.getStripePaymentResultRishikesh(
      req.body
    );
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json(error);
  }
}
module.exports = {
  getPaymentDetailsById,
  checkoutStripeForRishikesh,
  getStripePaymentResultRishikesh,
};
