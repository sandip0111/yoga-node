const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    courseId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'courses'
      },
    studentId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'student'
    },
    paymentId:{
        type:String
    },
    amount:{
        type:String
    },
    currency:{
        type:String
    },
    paymentStatus:{
        type:String
    },
    paymentBy:{
        type:String
    },
    created:{
        type: Date,
        default: function() {
            return new Date(Date.now() + (5.5 * 60 * 60 * 1000));
          }
    }
})

const blog = mongoose.model('payment',paymentSchema);

module.exports = blog;
