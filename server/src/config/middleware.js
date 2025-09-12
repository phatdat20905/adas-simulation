import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import express from 'express';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Cài đặt middleware cho Express app
 */
const setupMiddleware = (app) => {
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"], // FE URLs
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Range"],
    exposedHeaders: ["Content-Range", "Accept-Ranges", "Content-Length"],
  })
);
  app.use(morgan('combined'));
  app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ limit: "10mb", extended: true }));

  // Phục vụ file tĩnh
  app.use('/Uploads', express.static(join(__dirname, '../../Uploads')));
  app.use('/Processed', express.static(join(__dirname, '../../Processed')));

  // Rate limit cho API simulate
  const simulateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: 10, // tối đa 10 request
  });
  app.use('/api/simulations/simulate', simulateLimiter);

  // Rate limit chung
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
  });
  app.use(limiter);
};

export default setupMiddleware;
