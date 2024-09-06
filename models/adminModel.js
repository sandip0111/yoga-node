const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  email: {
    type: String,
  },
  password: {
    type: String,
  },
  isActive: Boolean,
  created: {
    type: Date,
    default: function() {
      return new Date(Date.now() + (5.5 * 60 * 60 * 1000));
    }
  },
});

const admin = mongoose.model("admin", adminSchema);

module.exports = admin;

// [{
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'user'
//   }]
