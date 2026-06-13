const mongoose = require("mongoose");

const freeWebinarSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  email: {
    type: String,
  },
  webinarDate: {
    type: Date,
  },
  created: {
    type: Date,
    default: function () {
      return new Date(Date.now());
    },
  },
  isAdminMailSend: {
    type: Boolean,
    default: false,
  },
  month: {
    type: String,
    default: () => "June, 2026",
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
});

const freeWebinarModel = mongoose.model("freeWebinar", freeWebinarSchema);

module.exports = freeWebinarModel;
