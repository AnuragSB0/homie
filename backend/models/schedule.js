const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  deviceId: { type: String, required: true }, // e.g., 'lr-light-1'
  action: { type: String, required: true },   // 'ON' or 'OFF'
  time: { type: String, required: true },     // Format: 'HH:MM' (24-hour)
  days: [{ type: Number }],                   // Array of days [0, 1, 2...] (0 = Sunday)
  enabled: { type: Boolean, default: true }
});

module.exports = mongoose.model('Schedule', scheduleSchema);