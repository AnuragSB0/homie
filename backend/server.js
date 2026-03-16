require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const mqtt = require('mqtt');
const cron = require('node-cron'); // Assuming you are still using this for schedules

const app = express();

// ==========================================
// 1. MIDDLEWARE (The CORS Insurance Policy)
// ==========================================
app.use(cors()); // Allows Netlify to talk to Render
app.use(express.json());

// ==========================================
// 2. DATABASE CONNECTION (MongoDB)
// ==========================================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas!'))
  .catch((err) => {
    console.error('❌ MongoDB Connection Error. Check your MONGO_URI string!');
    console.error(err);
  });

// ==========================================
// 3. CLOUD BROKER CONNECTION (HiveMQ)
// ==========================================
console.log('--- INITIATING HIVEMQ CONNECTION ---');
const mqttClient = mqtt.connect(process.env.MQTT_BROKER_URL, {
  username: process.env.MQTT_USER,
  password: process.env.MQTT_PASS,
  reconnectPeriod: 5000 // Auto-reconnect if Render drops the connection
});

mqttClient.on('connect', () => {
  console.log('✅ Connected to HiveMQ Cloud from Render!');
});

mqttClient.on('error', (err) => {
  console.error('❌ MQTT Connection Error:', err);
});

// ==========================================
// 4. MONGOOSE SCHEMAS & MODELS
// ==========================================
// A basic schema to store device states
const deviceSchema = new mongoose.Schema({
  deviceId: { type: String, required: true, unique: true }, // e.g., 'lr-light-1'
  name: String,
  state: { type: String, default: 'OFF' } // 'ON' or 'OFF'
});

const Device = mongoose.model('Device', deviceSchema);

// ==========================================
// 5. API ROUTES
// ==========================================

// Route: Get all devices to display on the Netlify dashboard
app.get('/api/devices', async (req, res) => {
  try {
    const devices = await Device.find();
    res.json(devices);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch devices' });
  }
});

// Route: Toggle a device state from the Netlify dashboard
app.post('/api/devices/toggle', async (req, res) => {
  const { deviceId, state } = req.body; // e.g., deviceId: 'lr-light-1', state: 'ON'

  try {
    // 1. Update the database so the UI remembers the state
    const updatedDevice = await Device.findOneAndUpdate(
      { deviceId: deviceId },
      { state: state.toUpperCase() },
      { new: true, upsert: true } // Creates the device if it doesn't exist yet
    );

    // 2. Broadcast the command to the physical NodeMCU via HiveMQ
    const topic = `homie/device/${deviceId}/set`;
    
    if (mqttClient.connected) {
      mqttClient.publish(topic, state.toUpperCase(), (err) => {
        if (err) {
          console.error(`⚠️ Failed to send MQTT message to ${deviceId}:`, err);
        } else {
          console.log(`📡 BROADCAST SUCCESS: Sent [${state.toUpperCase()}] to [${topic}]`);
        }
      });
    } else {
      console.error('⚠️ Cannot send command: Backend is disconnected from HiveMQ');
    }

    // 3. Respond back to the frontend
    res.json({ message: 'Device toggled successfully', device: updatedDevice });

  } catch (error) {
    console.error('Toggle Error:', error);
    res.status(500).json({ error: 'Failed to toggle device' });
  }
});

// ==========================================
// 6. START THE SERVER
// ==========================================
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Homie Backend is running on port ${PORT}`);
});