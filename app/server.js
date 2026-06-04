const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// API mock endpoint
app.get('/api/data', (req, res) => {
  res.json({
    message: 'Mock API response',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Node App Mock',
    status: 'running',
    endpoints: ['/health', '/api/data']
  });
});

app.listen(PORT, () => {
  console.log(`Node app running on port ${PORT}`);
});
