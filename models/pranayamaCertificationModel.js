const mongoose = require("mongoose");

const pranayamaCertificationSchema = new mongoose.Schema({
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
    default: () => "February, 2027",
  },
  isAdminMailSend: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model(
  "pranayamaCertificationModel",
  pranayamaCertificationSchema
);
