const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    coursetitle:{
      type:String
    },
    courseDesc:{
      type:String
    },
    courseintrovideoId:{
        type:String
    },
    courseMentor:{
        type:String
    },
    metaTitle:{
        type:String
    },
    metaKeyword:{
        type:String
    },
    metaDescription:{
        type:String
    },
    shortDesc:{
    type:String
    },
    content:{
        type:Array
    },
    curriculumInfo:{
   type:Array
    },
    scheduleInfo:{
        type:Array
         },
    videoInfo:{
    type:Array
    },
    feeInfo:{
        type:Array
    },
    faqInfo:{
  type:Array
    },
    upcomingEventInfo:{
  type:Array
    },
    accommodationInfo:{
        type:Array
    },
    foodInfo:{
        type:Array
    },
    slug:{
        type:String
    },
    priceId:{
        type:String
    },
    subjectInfo:{
        type:String
    },
    iAndEinfo:{
    type:String
    },
    sliderImage:{
        type:String
        },
        wistiaProjectId:{
            type:String
        },
        wistiaProjectIntroVideoId:{
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

const course = mongoose.model('courses',courseSchema);

module.exports = course;

// [{
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'user'
//   }]
