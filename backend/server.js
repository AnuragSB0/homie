require('dotenv').config(); // MUST BE FIRST
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// 1. Import MQTT Client right here!
// Since dotenv ran on line 1, this will successfully find your HiveMQ credentials
const mqttClient = require('./mqttClient'); 

// 2. Initialize the Express App
const app = express();

// 3. Middleware
app.use(cors()); // Allows frontend to connect
app.use(express.json()); // Allows server to parse JSON data

// 4. Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/hardware', require('./routes/hardware'));
// NEW: Route for creating, reading, and deleting automations
app.use('/api/schedules', require('./routes/schedules')); 

// Basic Test Route
app.get('/', (req, res) => {
    res.send('Homie API is running...');
});

// 5. Background Services
// NEW: Initialize the node-cron engine to run schedules automatically
require('./services/automation'); 

// 6. Database Connection & Server Start
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('✅ MongoDB Connected successfully.');
        
        // Start Server only after DB connects
        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error('❌ MongoDB connection error:', error.message);
    });