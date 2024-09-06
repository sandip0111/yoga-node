const mongoose = require('mongoose');

const pagesSchema = new mongoose.Schema({
    title:{
        type:String
    },
    slug:{
        type:String
    },
    text:{
        type:String
    },
    seotitle:{
        type:String
    },
    seokeywords:{
        type:String
    },
    seodescription:{
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

const page = mongoose.model('pages',pagesSchema);

module.exports = page;

// [{
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'user'
//   }]
