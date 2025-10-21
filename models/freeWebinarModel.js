const mongoose = require('mongoose');

const freeWebinarSchema = new mongoose.Schema({
    name:{
        type:String
    },
    email:{
        type:String
    },
    webinarDate:{
        type:Date
    },
    created:{
        type: Date,
        default: function() {
            return new Date(Date.now() + (5.5 * 60 * 60 * 1000));
          }
    }
})

const freeWebinarModel = mongoose.model('freeWebinar',freeWebinarSchema);

module.exports = freeWebinarModel;
