const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
    videoId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'onlinevideos'
      },
    studentId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'student'
    },
    playsCount:{
     type:String
    },
    created:{
        type: Date,
        default: function() {
            return new Date(Date.now() + (5.5 * 60 * 60 * 1000));
          }
    }
})

const analytics = mongoose.model('analytics',analyticsSchema);

module.exports = analytics;

// [{
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'user'
//   }]
