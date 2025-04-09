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
  phoneNumber: {
    type: String,
    required: true
  },
  address: {
    type: String
  },
  created:{
    type: Date,
    default: function() {
        return new Date(Date.now() + (5.5 * 60 * 60 * 1000));
      }
    },
    currency:{
        type:String
    },
    price:{
        type:String
    }, 
  courseStartDate: {
    type: Date,
    required: false
  },
  courseTimeDuration: {
    type: String,
    required: false
  },
  
  paymentStatus: {
    type: String, 
    enum: ['pending', 'paid', 'failed'], 
    required: false, // Nullable
    default: 'pending' 
  },
  paymentId: {
    type: String, 
    required: false 
  },

});

module.exports = mongoose.model('pranicPurificationUsersModel', userSchema);
