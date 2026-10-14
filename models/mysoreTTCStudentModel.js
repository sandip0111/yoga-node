const mongoose = require("mongoose");

const mysoreTTCStudentchema = new mongoose.Schema({
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
    default: "October, 2027",
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
});

const mysoreTTCStudentModel = mongoose.model(
  "mysoreTTCStudentModel",
  mysoreTTCStudentchema,
);

module.exports = mysoreTTCStudentModel;
