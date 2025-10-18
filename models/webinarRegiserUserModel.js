const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
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
    required: true,
  },
  city: {
    type: String,
  },
  webinar: {
    type: String,
  },
  refferalCode: {
    type: String,
    required: false,
  },
  password: {
    type: String,
    required: true,
  },
  company: {
    type: String,
    required: false,
  },
  created: {
    type: Date,
    required: false,
  },
  lastTimeLoggedIn: {
    type: Date,
    required: false,
  },
  timeSlot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TimeSlots",
    required: false,
  },
  priceId: {
    type: String,
    required: false,
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "failed"],
    required: false, // Nullable
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
  isPaymentCheck: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("WebinarRegisterUser", userSchema);
