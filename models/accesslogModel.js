const mongoose = require('mongoose');

const accesslogSchema = new mongoose.Schema({
    courseId:{
        type:String
    },
    studentId:{
        type:String
    },
    nextSchedule:{
     type:Array
    },
    created:{
        type: Date,
        default: function() {
            return new Date(Date.now() + (5.5 * 60 * 60 * 1000));
          }
    }
})

const accesslog = mongoose.model('accesslog',accesslogSchema);

module.exports = accesslog;

