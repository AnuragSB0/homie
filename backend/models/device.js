const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  deviceId: { 
    type: String, 
    required: true, 
    unique: true // e.g., 'lr-light-1'
  },
  name: { 
    type: String, 
    required: true // e.g., 'Living Room Light'
  },
  room: { 
    type: String, 
    required: true // e.g., 'Living Room'
  },
  type: {
    type: String,
    enum: ['relay', 'sensor'], // Expand as needed
    required: true
  },
  state: {
    type: mongoose.Schema.Types.Mixed, // Can be boolean (true/false) or a number (for dimmers/sensors)
    default: false
  },
  mqttTopicSet: {
    type: String,
    required: true // e.g., 'homie/livingroom/light1/set'
  },
  mqttTopicState: {
    type: String,
    required: true // e.g., 'homie/livingroom/light1/state'
  }
}, { timestamps: true });

module.exports = mongoose.model('Device', deviceSchema);