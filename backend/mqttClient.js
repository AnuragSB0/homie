const mqtt = require('mqtt');

const brokerUrl = process.env.MQTT_BROKER_URL;
const options = {
  // A unique client ID is required by the broker to keep track of sessions
  clientId: 'homie-backend-' + Math.random().toString(16).substring(2, 10),
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD,
};

console.log('Attempting to connect to HiveMQ Cloud...');
const client = mqtt.connect(brokerUrl, options);

client.on('connect', () => {
  console.log('✅ Successfully connected to HiveMQ Cloud Broker');
  
  // Subscribe to all device state topics to listen for hardware updates
  // The '+' is an MQTT wildcard. This subscribes to homie/livingroom/light1/state, homie/bedroom/fan1/state, etc.
  client.subscribe('homie/+/+/state', (err) => {
    if (!err) {
      console.log('✅ Subscribed to hardware state topics');
    } else {
      console.error('❌ Failed to subscribe:', err);
    }
  });
});

client.on('error', (err) => {
  console.error('❌ MQTT Connection Error:', err);
});

client.on('offline', () => {
  console.log('⚠️ MQTT Client is offline. Attempting to reconnect...');
});

module.exports = client;