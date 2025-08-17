import multer from 'multer';
import { extname, join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import * as uploadService from '../services/uploadService.js';
import fs from 'fs/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, join(__dirname, '../../Uploads/'));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|mp4/;
    const extnameValid = filetypes.test(extname(file.originalname).toLowerCase());
    const mimetypeValid = filetypes.test(file.mimetype);
    if (extnameValid && mimetypeValid) {
      return cb(null, true);
    } else {
      cb(new Error('Images (jpeg, jpg, png) or videos (mp4) only!'));
    }
  },
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
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
      const simulation = await uploadService.uploadFile({ file: req.file, vehicleId: req.body.vehicleId, userId: req.user.id });
      res.status(201).json({
        success: true,
        message: 'File uploaded and simulation created',
        data: { simulation },
      });
    } catch (error) {
      console.error('Upload error:', error);
      if (req.file) {
        await fs.unlink(join(__dirname, '../../Uploads/', req.file.filename)).catch((err) => console.error('Failed to delete file:', err));
      }
      res.status(400).json({ success: false, message: `Failed to save simulation: ${error.message}` });
    }
  });
};

export { uploadFile };