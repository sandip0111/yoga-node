const mongoose = require("mongoose");

const couponCodeSchema = new mongoose.Schema({
  code: String,
  slug: String,
  email: {
    type: String,
    ref: "student",
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "student",
  },
  isUsed: {
    type: Boolean,
    default: false,
  },
  created: {
    type: Date,
    default: () => new Date(),
  },
});

const couponCode = mongoose.model("couponCode", couponCodeSchema);

module.exports = couponCode;
