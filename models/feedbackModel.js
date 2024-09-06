const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    courseId:{
        type:String
    },
    studentId:{
        type:String
    },
    hashed_id:{
        type:String
    },
    day:{
        type:String
    },
    question1:{
        type:String
    },
    question2:{
        type:String
    },
    question3:{
        type:String
    },
    questionList:{
        type:Array
    },
    answerList:{
      type:Array
    },
    videoReview:{
   type:String
    },
    created:{
        type: Date,
        default: function() {
            return new Date(Date.now() + (5.5 * 60 * 60 * 1000));
          }
    }
})

const feedback = mongoose.model('feedback',feedbackSchema);

module.exports = feedback;

// [{
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'user'
//   }]
