const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

const { getEnv } = require('./config/env');
const { initSocket } = require('./config/socket');

const authRoutes = require('./routes/authRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const adminRoutes = require('./routes/adminRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();
const server = http.createServer(app);

// Initialize socket
initSocket(server);

const clientOrigin = getEnv('CLIENT_ORIGIN', 'http://localhost:3000');

// Middleware configurations
app.use(helmet({
  crossOriginResourcePolicy: false // Allows files to be fetched from backend by client
}));
app.use(cors({
  origin: clientOrigin.split(',').map((o) => o.trim()),
  credentials: true
}));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Ensure uploads directory exists (Render/Railway ephemeral disk)
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Static uploads serving
app.use('/uploads', express.static(uploadDir));

// Health Check
app.get('/api/health', (req, res) => {
  return res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// REST Routes mount
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', notificationRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('SERVER ERROR:', err.stack);
  return res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

const PORT = getEnv('PORT', 5000);
const HOST = getEnv('HOST', '0.0.0.0');
server.listen(PORT, HOST, () => {
  console.log(`CampusFix Server listening on ${HOST}:${PORT}`);
});

module.exports = { app, server };
