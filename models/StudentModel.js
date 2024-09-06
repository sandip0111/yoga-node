const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    firstName:{
        type:String
    },
    lastName:{
        type:String
    },
    email:{
        type:String
    },
    city:{
        type:String
    },
    phoneNumber:{
        type:Number
    },
    course:{
        type:Array
    },
    password:{
        type:String
    },
    enrollmentDate:{
        type:String
    },
    sentEmail:{
        type:String
    },
    source:{
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

const Student = mongoose.model('student',studentSchema);

module.exports = Student;

// [{
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'user'
//   }]
