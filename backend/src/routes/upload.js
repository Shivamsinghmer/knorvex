import express from 'express';
import multer from 'multer';
import auth from '../middleware/auth.js';
import { uploadImage } from '../controllers/uploadController.js';

const router = express.Router();

const ALLOWED_MIMES = [
  'image/jpeg','image/png','image/webp','image/gif','image/svg+xml',
  'application/pdf',
  'application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain','text/csv',
  'application/zip','application/x-zip-compressed',
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIMES.includes(file.mimetype)) cb(null, true);
    else cb(new Error('File type not allowed.'));
  },
});

router.post('/', auth, upload.single('image'), uploadImage);

export default router;
