const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { setIO } = require('./utils/socketNotifier');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:4200',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});
setIO(io);

// Socket.IO Connection Handler
io.on('connection', (socket) => {
  console.log(`[Socket.IO Client Connected]: ${socket.id}`);

  socket.on('join_role_room', (role) => {
    if (['admin', 'responder', 'citizen'].includes(role)) {
      socket.join(role);
      console.log(`Socket ${socket.id} joined room: ${role}`);
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.IO Client Disconnected]: ${socket.id}`);
  });
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:4200',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic Security Headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Health-check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    system: 'ResQ Mangaluru API',
    location: 'Mangaluru, Karnataka, India',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/incidents', require('./routes/incidentRoutes'));
app.use('/api/shelters', require('./routes/shelterRoutes'));
app.use('/api/volunteers', require('./routes/volunteerRoutes'));
app.use('/api/donations', require('./routes/donationRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/users', require('./routes/userRoutes'));

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API Route not found - ${req.originalUrl}`
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` ResQ Mangaluru API Server running on port ${PORT} `);
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(` Health check: http://localhost:${PORT}/api/health `);
  console.log(`====================================================`);
});
