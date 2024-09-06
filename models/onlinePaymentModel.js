const mongoose = require('mongoose');

const onlinepaymentSchema = new mongoose.Schema({
    name:{
        type:String
    },
    email:{
        type:String
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
    paymentStatus:{
        type:String
    },
    created:{
        type: Date,
        default: function() {
            return new Date(Date.now() + (5.5 * 60 * 60 * 1000));
          }
    }
})

const onlineP = mongoose.model('onlinepayment',onlinepaymentSchema);

module.exports = onlineP;
