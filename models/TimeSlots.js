const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema({
  slotDuration: {
    type: String, 
    required: true
  },
  webinarDate: {
    type: Date,
    required: true
  },
  webinarName: {
    type: String, // Name of the webinar
    required: true
  },
  zoomLink: {
    type: String,
    required: false
  },
  whatsAppGroupLink: {
    type: String,
    required: false
  }
}, { timestamps: true });

module.exports = mongoose.model('TimeSlots', timeSlotSchema);
