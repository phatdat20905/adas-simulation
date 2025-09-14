import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import express from 'express';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const setupMiddleware = (app) => {
  // CORS
  app.use(
    cors({
      origin: ["http://localhost:5173", "http://localhost:3000"],
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "Range"],
      exposedHeaders: ["Content-Range", "Accept-Ranges", "Content-Length"],
      credentials: true, // nếu FE cần gửi cookie/token
    })
  );

  // Logger
  app.use(morgan('combined'));

  // Bảo mật cơ bản
  app.use(
    helmet({
      crossOriginResourcePolicy: false,
    })
  );

  // Body parser
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Static files
  app.use('/Uploads', express.static(join(__dirname, '../../Uploads')));
  app.use('/Processed', express.static(join(__dirname, '../../Processed')));

  // Rate limit cho API simulate
  const simulateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: 10,
    message: { success: false, message: 'Too many simulate requests, try again later.' }
  });
  app.use('/api/simulations/simulate', simulateLimiter);

  // Rate limit chung
  // const limiter = rateLimit({
  //   windowMs: 15 * 60 * 1000,
  //   max: 100,
  //   standardHeaders: true,
  //   legacyHeaders: false,
  //   message: { success: false, message: 'Too many requests, please try again later.' }
  // });
  // app.use(limiter);
};

export default setupMiddleware;
