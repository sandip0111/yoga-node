const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  categoryname: {
    type: String,
  },
  metatitle: {
    type: String,
  },
  metadescription: {
    type: String,
  },
  metakeyword: {
    type: String,
  },
  slug:{
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

const category = mongoose.model("category", categorySchema);

module.exports = category;

// [{
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'user'
//   }]
