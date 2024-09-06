const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema({
    name:{
        type:String
    },
    email:{
        type:String
    },
    contact:{
        type:String
    },
    course:{
        type:String
    },
    message:{
        type:String
    },
    courseDate:{
        type:String
    },
    subject:{
        type:String
    },
    package:{
        type:String
    },
    type:{
        type:String
    },
    created:{
        type: Date,
        default: function() {
            return new Date(Date.now() + (5.5 * 60 * 60 * 1000));
          }
    }
})

const inquiry = mongoose.model('inquiry',inquirySchema);

module.exports = inquiry;

// [{
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'user'
//   }]
