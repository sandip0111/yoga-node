const mongoose = require("mongoose");

const baliStudentSchema = new mongoose.Schema({
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
    enum: ["stripe", "paypal"],
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
    // default: () => "March, 2026",
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("baliStudentModel", baliStudentSchema);
