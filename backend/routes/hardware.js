const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const mpinMiddleware = require('../middleware/mpinMiddleware');
const mqttClient = require('../mqttClient');
const Device = require('../models/device'); // Ensure this matches your model path

// @route   POST /api/hardware/master-failsafe
// @desc    Trigger the master failsafe (Requires JWT AND MPIN)
router.post('/master-failsafe', [authMiddleware, mpinMiddleware], async (req, res) => {
    try {
        // 1. The MQTT Kill Command
        // We publish a '0' to a global topic. You will program your NodeMCU 
        // to always listen to 'homie/global/set' and shut off all relays if it hears a '0'.
        mqttClient.publish('homie/global/set', '0', (err) => {
            if (err) console.error('❌ MQTT global publish failed:', err);
        });

        // 2. Update Database State
        // Find every device in your database and set its state to false (off)
        // so your React frontend updates instantly.
        await Device.updateMany({}, { state: false });

        console.log('🚨 MASTER FAILSAFE TRIGGERED: Global shutoff sent to HiveMQ.');
        res.json({ message: "CRITICAL ACTION EXECUTED: Master Failsafe Triggered & Hardware Shut Down!" });
    } catch (error) {
        console.error('❌ Failsafe error:', error);
        res.status(500).json({ error: 'Server error executing failsafe' });
    }
});

// @route   POST /api/hardware/:deviceId/toggle
// @desc    Toggle a specific device's state (Requires JWT only)
router.post('/:deviceId/toggle', authMiddleware, async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { state } = req.body; // Expecting boolean (true = ON, false = OFF)

        if (typeof state !== 'boolean') {
            return res.status(400).json({ error: 'State must be a boolean (true or false)' });
        }

        // 1. Update the database
        const device = await Device.findOne({ deviceId: deviceId });
        let topic = `homie/test/${deviceId}/set`; // Default fallback topic

        if (device) {
            device.state = state;
            await device.save();
            topic = device.mqttTopicSet;
        } else {
            console.warn(`⚠️ Device ${deviceId} not found in DB. Sending test MQTT command anyway.`);
        }

        // 2. Publish to MQTT
        // Send '1' for true, '0' for false
        const payload = state ? '1' : '0';
        
        mqttClient.publish(topic, payload, (err) => {
            if (err) {
                console.error('❌ Failed to publish MQTT message:', err);
                return res.status(500).json({ error: 'Failed to communicate with hardware' });
            }
            
            console.log(`📡 Published to [${topic}]: ${payload}`);
            res.json({ 
                success: true, 
                message: `Command sent to ${deviceId}`,
                state: state
            });
        });

    } catch (error) {
        console.error('❌ Server error toggling device:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;