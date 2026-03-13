const cron = require('node-cron');
const Schedule = require('../models/schedule');
const mqttClient = require('../mqttClient'); // FIXED: Added ../ to find the file in the root directory

// This runs every single minute
cron.schedule('* * * * *', async () => {
  const now = new Date();
  // Format current time to match 'HH:MM'
  const currentHour = String(now.getHours()).padStart(2, '0');
  const currentMinute = String(now.getMinutes()).padStart(2, '0');
  const currentTime = `${currentHour}:${currentMinute}`;
  const currentDay = now.getDay(); // 0-6

  try {
    // Find all enabled schedules that match the current time and day
    const activeSchedules = await Schedule.find({
      enabled: true,
      time: currentTime,
      days: currentDay
    });

    if (activeSchedules.length > 0) {
      console.log(`Executing ${activeSchedules.length} scheduled tasks...`);
      
      activeSchedules.forEach(schedule => {
        // Construct the specific MQTT topic for this device
        const topic = `homie/device/${schedule.deviceId}/set`; 
        
        // Publish to HiveMQ
        mqttClient.publish(topic, schedule.action);
        console.log(`Published ${schedule.action} to ${topic}`);
      });
    }
  } catch (error) {
    console.error("Error running cron automations:", error);
  }
});