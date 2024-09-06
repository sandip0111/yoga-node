const mongoose = require("mongoose");

const sliderSchema = new mongoose.Schema({
  metaname: {
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
  title: {
    type: String,
  },
  image:{
type: String,
  },
  para:{
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

const slider = mongoose.model("slider", sliderSchema);

module.exports = slider;

// [{
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'user'
//   }]
