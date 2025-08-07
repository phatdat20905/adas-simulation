import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import helmet from 'helmet';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import apiRoutes from './routes/index.js';
import connectDB from './config/db.js';
import { Server } from 'socket.io';
import initSocket, { emitAlert } from './socket.js';
import { createServer } from 'http';
import rateLimit from 'express-rate-limit';

// Load environment variables
dotenv.config();

// Initialize Express
const app = express();
const server = createServer(app);
const io = initSocket(server);
const __dirname = dirname(fileURLToPath(import.meta.url));


// Rate limit cho /api/simulations/simulate
const simulateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 10, // 10 request mỗi 15 phút
});
app.use('/api/simulations/simulate', simulateLimiter);

// Rate limit chung
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use(limiter);

// Middleware
app.use(cors());
app.use(morgan('combined')); // Thêm Morgan logging
app.use(helmet());
app.use(express.json()); // Parse JSON body
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded body
app.use('/Uploads', express.static(__dirname + '/Uploads'));

// Routes
app.use('/api', apiRoutes);

// Export io for use in controllers
export { io };

// Connect to MongoDB
connectDB();

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});