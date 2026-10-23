const express = require('express');
const cors = require('cors');
require('dotenv').config();
const apiRoutes = require('./routes/api');
const prisma = require('./prisma/client');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json());
app.use('/api', apiRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running successfully!' });
});

async function start() {
  await prisma.$connect();
  app.listen(PORT, () => {
    console.log(`Backend server is running on port ${PORT}`);
  });
}

if (require.main === module) {
  start().catch((error) => {
    console.error('Failed to start backend server:', error);
    process.exitCode = 1;
  });
}

module.exports = app;
