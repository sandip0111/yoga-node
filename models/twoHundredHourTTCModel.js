const mongoose = require("mongoose");

const twoHundredHourTTCSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  package: {
    type: String,
  },
  currency: {
    type: String,
  },
  price: {
    type: String,
  },
  courseStartDate: {
    type: Date,
    required: false,
  },
  courseTimeDuration: {
    type: String,
    required: false,
  },
  created: {
    type: Date,
    default: function () {
      return new Date();
    },
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "failed"],
    required: false,
    default: "pending",
  },
  paymentId: {
    type: String,
    required: false,
  },
  installment: {
    type: String,
    default: "2nd",
  },
  dueAmount: {
    type: Number,
    default: 0,
  },
  paymentType: {
    type: String,
    enum: ["razorpay", "stripe", "paypal"],
    required: false,
    default: null,
  },
  isPaymentCheck: {
    type: Boolean,
    default: false,
  },
  month: {
    type: String,
    default: () => "November, 2026",
  },
  isAdminMailSend: {
    type: Boolean,
    default: false,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model(
  "twoHundredHourTTCModel",
  twoHundredHourTTCSchema
);
