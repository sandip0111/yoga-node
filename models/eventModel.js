const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title:{
        type:String
    },
    location:{
        type:String
    },
    url:{
        type:String
    },
    seat:{
        type:String
    },
    image:{
        type:String
    },
    type:{
        type:String
    },
    startDate:{
        type:String
    },
    endDate:{
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

const event = mongoose.model('events',eventSchema);

module.exports = event;

// [{
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'user'
//   }]
