const mongoose = require('mongoose');

const liveCoursesCustomerSchema = new mongoose.Schema({
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
  currency:{
    type:String
  },
  price:{
      type:String
  },
  paymentId:{
      type:String
  },
  courses: [
    {
      title: { type: String, required: true },
      shortDescription: { type: String, required: false },
      priceINR: { type: String, required: false },
      priceUSD: { type: String, required: false },
      quantity: { type: String, required: true },
      priceInfo: { type: String, required: false }
    }
  ],
  

  paymentStatus:{
      type:String
  },
  created:{
      type: Date,
      default: function() {
          return new Date(Date.now() + (5.5 * 60 * 60 * 1000));
        }
}
});



module.exports = mongoose.model('liveCoursesCustomer', liveCoursesCustomerSchema);
