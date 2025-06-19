const mongoose = require("mongoose");

const twoHundredHourTTCSchema = new mongoose.Schema({
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
  package: {
    type: String,
  },
  currency: {
    type: String,
  },
  price: {
    type: String,
  },
  courseStartDate: {
    type: Date,
    required: false,
  },
  courseTimeDuration: {
    type: String,
    required: false,
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
});

module.exports = mongoose.model(
  "twoHundredHourTTCModel",
  twoHundredHourTTCSchema
);
