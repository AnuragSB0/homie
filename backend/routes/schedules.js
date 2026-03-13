// backend/routes/schedules.js
const express = require('express');
const router = express.Router();
const Schedule = require('../models/schedule'); // Ensure this matches your exact filename

// ==========================================
// GET /api/schedules 
// Fetch all automations for the frontend
// ==========================================
router.get('/', async (req, res) => {
  try {
    const schedules = await Schedule.find();
    res.status(200).json(schedules);
  } catch (error) {
    console.error("Error fetching schedules:", error);
    res.status(500).json({ error: 'Failed to retrieve schedules' });
  }
});

// ==========================================
// POST /api/schedules 
// Save a new automation from the frontend
// ==========================================
router.post('/', async (req, res) => {
  try {
    // Destructure the data coming from your frontend modal
    const { deviceId, action, time, days, enabled } = req.body;

    // Create a new schedule document
    const newSchedule = new Schedule({
      deviceId,
      action,
      time,
      days,
      enabled: enabled !== undefined ? enabled : true
    });

    // Save to MongoDB
    const savedSchedule = await newSchedule.save();
    
    // Return the saved document so the frontend can update its UI
    res.status(201).json(savedSchedule);
  } catch (error) {
    console.error("Error saving schedule:", error);
    res.status(400).json({ error: 'Failed to save schedule' });
  }
});

// ==========================================
// DELETE /api/schedules/:id
// Remove an automation
// ==========================================
router.delete('/:id', async (req, res) => {
  try {
    const deletedSchedule = await Schedule.findByIdAndDelete(req.params.id);
    
    if (!deletedSchedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    
    res.status(200).json({ message: 'Schedule successfully deleted' });
  } catch (error) {
    console.error("Error deleting schedule:", error);
    res.status(500).json({ error: 'Failed to delete schedule' });
  }
});

module.exports = router;