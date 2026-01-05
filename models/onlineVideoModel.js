const mongoose = require("mongoose");

const onlineVideoSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "courses",
  },
  title: {
    type: String,
  },
  videoName: {
    type: String,
  },
  sortBy: {
    type: String,
  },
  created: {
    type: Date,
    default: function () {
      return new Date(Date.now());
    },
  },
  month: {
    type: String,
  },
  teacherId: {
    type: Number,
  },
});

const videos = mongoose.model("onlinevideos", onlineVideoSchema);

module.exports = videos;

// [{
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'user'
//   }]
