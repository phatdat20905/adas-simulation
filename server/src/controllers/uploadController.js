import multer from 'multer';
import { extname, join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import * as uploadService from '../services/uploadService.js';
import fs from 'fs/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));

const allowedFileTypes = ['.jpeg', '.jpg', '.png', '.mp4'];

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = file.mimetype.startsWith('video') ? 'videos' : 'images';
    cb(null, join(__dirname, `../../Uploads/${folder}`));
  },
  filename: (req, file, cb) => {
    // Làm sạch tên file tránh ký tự lạ
    const safeName = file.originalname.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = extname(file.originalname).toLowerCase();
    if (allowedFileTypes.includes(ext)) {
      return cb(null, true);
    }
    cb(new Error('Only jpeg, jpg, png, mp4 files are allowed!'));
  },
  limits: { fileSize: 100 * 1024 * 1024 }, // vẫn để 100MB chung, có thể tách riêng nếu cần
}).single('file');

const uploadFile = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    if (!req.body.vehicleId) {
      return res.status(400).json({ success: false, message: 'Vehicle ID is required' });
    }

    try {
      const simulation = await uploadService.uploadFile({
        file: req.file,
        vehicleId: req.body.vehicleId,
        userId: req.user.id,
      });
      res.status(201).json({
        success: true,
        message: 'File uploaded and simulation created',
        data: { simulation },
      });
    } catch (error) {
      console.error('Upload error:', error);
      if (req.file?.path) {
        await fs.unlink(req.file.path).catch((err) => console.error('Failed to delete file:', err));
      }
      res.status(400).json({ success: false, message: `Failed to save simulation: ${error.message}` });
    }
  });
};

export { uploadFile };
