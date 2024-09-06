const mongoose = require("mongoose");

const subcategorySchema = new mongoose.Schema({
categoryId:{
  type:String
    },
  subcategoryname: {
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
  slug:{
    type:String
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

const subcategory = mongoose.model("subcategory", subcategorySchema);

module.exports = subcategory;

// [{
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'user'
//   }]
