const mongoose = require("mongoose");

const subcatCourseSchema = new mongoose.Schema({
subcategoryId:{
  type:String
    },
  subcategorycoursename: {
    type: String,
  },
  metatitle: {
    type: String,
  },
  metadesc: {
    type: String,
  },
  metakeyword: {
    type: String,
  },
  slug: {
    type: String,
  },
  isActive:{
  type: Boolean,
  },
  created:{
    type: Date,
    default: function() {
      return new Date(Date.now() + (5.5 * 60 * 60 * 1000));
    }
}
});

const subcategorycourse = mongoose.model("subcategorycourse", subcatCourseSchema);

module.exports = subcategorycourse;

// [{
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'user'
//   }]
