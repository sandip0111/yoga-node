const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "courses",
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "student",
  },
  paymentId: {
    type: String,
  },
  amount: {
    type: String,
  },
  currency: {
    type: String,
  },
  paymentStatus: {
    type: String,
  },
  paymentBy: {
    type: String,
  },
  created: {
    type: Date,
    default: () => new Date(),
  },
  paymentType: {
    type: String,
    enum: ["razorpay", "stripe", "paypal"],
    required: false,
    default: null,
  },
});

const blog = mongoose.model("payment", paymentSchema);

module.exports = blog;
