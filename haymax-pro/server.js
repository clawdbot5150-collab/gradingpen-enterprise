// Simple Node.js server for HayMax Pro
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Serve static files
app.use(express.static(__dirname));

// Serve the main application
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve the simple version
app.get('/simple', (req, res) => {
    res.sendFile(path.join(__dirname, 'simple.html'));
});

// Serve the real estate version
app.get('/property', (req, res) => {
    res.sendFile(path.join(__dirname, 'real-estate.html'));
});

// API endpoints for future expansion
app.get('/api/weather/:lat/:lon', async (req, res) => {
    // Weather API integration point
    // For now, return sample data
    res.json({
        temp: Math.floor(Math.random() * 30) + 60,
        conditions: ['Sunny', 'Partly Cloudy', 'Cloudy', 'Light Rain'][Math.floor(Math.random() * 4)],
        humidity: Math.floor(Math.random() * 40) + 40,
        wind: Math.floor(Math.random() * 15) + 5,
        forecast: ['Sunny', 'Rain Later', 'Storms', 'Clear'][Math.floor(Math.random() * 4)]
    });
});

// Satellite data endpoint (future)
app.get('/api/satellite/:fieldId', (req, res) => {
    res.json({
        message: 'Satellite integration coming soon!',
        ndvi: Math.random() * 0.5 + 0.5, // Sample NDVI value
        lastUpdate: new Date().toISOString()
    });
});

app.listen(PORT, () => {
    console.log(`🌾 HayMax Pro server running on http://localhost:${PORT}`);
    console.log('📊 Ready for field mapping and yield tracking!');
});

module.exports = app;