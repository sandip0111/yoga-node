const mongoose = require("mongoose");

const onlinepaymentSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  email: {
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
  paymentStatus: {
    type: String,
  },
  paymentType: {
    type: String,
    enum: ["razorpay", "stripe", "paypal"],
    required: false,
    default: null,
  },
  created: {
    type: Date,
    default: function () {
      return new Date(Date.now());
    },
  },
});

const onlineP = mongoose.model("onlinepayment", onlinepaymentSchema);

module.exports = onlineP;
