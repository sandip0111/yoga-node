const mongoose = require('mongoose');

const mentorSchema = new mongoose.Schema({
    name:{
        type:String
    },
    title:{
        type:String
    },
    picture:{
        type:String
    },
    thumb:{
        type:String
    },
    slug:{
        type:String
    },
    isActive:Boolean,
    intro:{
        type:String
    },
    addedBy:{
        type:String
    },
    sortBy:{
        type:Number
    },
    created:{
        type: Date,
        default: function() {
            return new Date(Date.now() + (5.5 * 60 * 60 * 1000));
          }
    }
})

const mentor = mongoose.model('mentors',mentorSchema);

module.exports = mentor;

// [{
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'user'
//   }]
