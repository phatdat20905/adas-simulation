import express from 'express';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import apiRoutes from './routes/index.js';
import connectDB from './config/db.js';
import initSocket from './utils/socket.js';
import setupMiddleware from './config/middleware.js';
import setupDirectories from './config/directories.js';

// Load biến môi trường
dotenv.config();

const app = express();
const server = createServer(app);
const __dirname = dirname(fileURLToPath(import.meta.url));

// Middleware & Directories
setupMiddleware(app);
await setupDirectories();

// Khởi tạo socket.io
initSocket(server);

// Routes
app.use('/api', apiRoutes);

// Kết nối MongoDB
connectDB();

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
