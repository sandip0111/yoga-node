const mongoose = require('mongoose');

const subsSchema = new mongoose.Schema({
    email:{
        type:String
    },
    isActive:Boolean,
    created:{
        type: Date,
        default: function() {
            return new Date(Date.now() + (5.5 * 60 * 60 * 1000));
          }
    }
})

const Subscribe = mongoose.model('subscribe',subsSchema);

module.exports = Subscribe;

// [{
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'user'
//   }]
