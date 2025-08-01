import multer from 'multer';
import { extname, join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import Simulation from '../models/Simulation.js';

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
      cb('Error: Images (jpeg, jpg, png) or videos (mp4) only!');
    }
  },
}).single('file');

const uploadFile = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
      const simulation = new Simulation({
        filename: req.file.filename,
        filepath: `/Uploads/${req.file.filename}`,
        fileType: req.file.mimetype.startsWith('video') ? 'video' : 'image',
        vehicleId: req.body.vehicleId,
        userId: req.user.id,
        status: 'pending',
      });

      await simulation.save();
      res.status(200).json({
        message: 'File uploaded successfully',
        simulation,
      });
    } catch (error) {
      res.status(500).json({ error: `Failed to save simulation: ${error.message}` });
    }
  });
};

export { uploadFile };