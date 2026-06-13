const mongoose = require("mongoose");

const MonthEnum = {
  March26: "March, 2026",
  October26: "October, 2026",
};

const rishikeshStudentSchema = new mongoose.Schema({
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
  hour: {
    type: Number,
  },
  room: {
    type: String,
  },
  currency: {
    type: String,
  },
  price: {
    type: String,
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
  paymentType: {
    type: String,
    enum: ["razorpay", "stripe", "paypal"],
    required: false,
    default: null,
  },
  orderId: {
    type: String,
    required: false,
  },
  isPaymentCheck: {
    type: Boolean,
    default: false,
  },
  month: {
    type: String,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
});

const rishikeshStudentModel = mongoose.model(
  "rishikeshStudentModel",
  rishikeshStudentSchema,
);

rishikeshStudentModel.MonthEnum = MonthEnum;

module.exports = rishikeshStudentModel;
