const mongoose = require("mongoose");

const liveCoursesCustomerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
  },
  currency: {
    type: String,
  },
  price: {
    type: String,
  },
  paymentId: {
    type: String,
  },
  courses: [
    {
      id: { type: Number, required: true },
      // title: { type: String, required: true },
      // shortDescription: { type: String, required: false },
      // priceINR: { type: String, required: false },
      // priceUSD: { type: String, required: false },
      // quantity: { type: String, required: true },
      // priceInfo: { type: String, required: false },
    },
  ],
  paymentStatus: {
    type: String,
  },
  created: {
    type: Date,
    default: () => new Date(),
  },
  month: {
    type: String,
    default: () => "August, 2026",
  },
  paymentType: {
    type: String,
    enum: ["razorpay", "stripe", "paypal", "admin"],
    required: false,
    default: null,
  },
  isPaymentCheck: {
    type: Boolean,
    default: false,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model(
  "liveCoursesCustomer",
  liveCoursesCustomerSchema
);
