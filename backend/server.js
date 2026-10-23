const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Test Route
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running successfully!' });
});

app.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}`);
});