const mongoose = require("mongoose");

const schema = new mongoose.Schema({
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
  },
  address: {
    type: String,
  },
  created: {
    type: Date,
    default: function () {
      return new Date(Date.now());
    },
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
  paymentStatus: {
    type: String,
    enum: ["pending", "paid"],
    required: false,
    default: "pending",
  },
  paymentId: {
    type: String,
    required: false,
  },
  month: {
    type: String,
    default: () => "May, 2026",
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
  isOneHourMailSend: {
    type: Boolean,
    default: false,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("pranicPurificationUsersIIModel", schema);
