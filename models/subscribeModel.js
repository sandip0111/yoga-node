const mongoose = require("mongoose");

const subsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    minlength: [2, "Name must be at least 2 characters"],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      "Please provide a valid email address",
    ],
  },
  created: {
    type: Date,
    default: Date.now,
  },
  emailStage: {
    type: Number,
    default: 0, // 0: No emails sent, 1: First email sent, etc.
  },
  nextEmailDate: {
    type: Date,
    default: null,
  },
});

const Subscribe = mongoose.model("subscribe", subsSchema);

module.exports = Subscribe;
