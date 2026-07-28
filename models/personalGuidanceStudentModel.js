const mongoose = require("mongoose");

const personalGuidanceStudentSchema = new mongoose.Schema({
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
  courseType: {
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
    enum: ["razorpay", "stripe", "paypal", "admin"],
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
    default: '',
  },
  selectedDate: {
    type: String
  },
  selectedSlot: {
    type: String
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
});

const personalGuidanceStudentModel = mongoose.model(
  "personalGuidanceStudentModel",
  personalGuidanceStudentSchema,
);

module.exports = personalGuidanceStudentModel;
