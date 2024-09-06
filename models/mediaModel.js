const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
    title:{
        type:String
    },
    image:{
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

const media = mongoose.model('media',mediaSchema);

module.exports = media;

// [{
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'user'
//   }]
