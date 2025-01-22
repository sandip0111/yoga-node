const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phone: {
    type: String,
    required: true
  },
  city: {
    type: String
  },
  webinar:{
    type: String
  },
  company: {
    type: String,
    required: false
  }
});

module.exports = mongoose.model('WebinarRegisterUser', userSchema);
