const mongoose = require('mongoose');

const testSchema = new mongoose.Schema({
    testimonial:{
        type:String
    },
    name:{
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

const testimonial = mongoose.model('testimonials',testSchema);

module.exports = testimonial;

// [{
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'user'
//   }]
