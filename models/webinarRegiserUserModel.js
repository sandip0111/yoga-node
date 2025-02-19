const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
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
  refferalCode:{
    type: String,
    required: true
  },
  password:{
    type: String,
    required: true
  },
  company: {
    type: String,
    required: false
  },
  created: {
    type: Date,
    required: false
  },
  lastTimeLoggedIn: {
    type: Date,
    required: false
  },
});

module.exports = mongoose.model('WebinarRegisterUser', userSchema);
