const mongoose = require("mongoose");

const retreatStudentSchema = new mongoose.Schema({
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
    default: 'September, 2026',
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
});

const retreatStudentModel = mongoose.model(
  "retreatStudentModel",
  retreatStudentSchema,
);

module.exports = retreatStudentModel;
