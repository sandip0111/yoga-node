const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
    authorId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'mentors'
      },
    title:{
        type:String
    },
    image:{
        type:String
    },
    slug:{
        type:String
    },
    isActive:Boolean,
    addedBy:{
        type:String
    },
    shortDesc:{
        type:String
    },
    content:{
        type:String
    },
    seokeywords:{
        type:String
    },
    seodescription:{
        type:String
    },
    readCounter:{
        type:String
    },
    sortBy:{
        type:String
    },
    created:{
        type: Date,
        default: function() {
            return new Date(Date.now() + (5.5 * 60 * 60 * 1000));
          }
    }
})

const blog = mongoose.model('blogs',blogSchema);

module.exports = blog;

// [{
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'user'
//   }]
