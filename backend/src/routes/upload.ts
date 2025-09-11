import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { asyncHandler, ValidationError } from '../middleware/errorHandler';
import { config, allowedFileTypes } from '../config/environment';
import { logger } from '../utils/logger';

const router = Router();

// Ensure upload directory exists
const ensureUploadDir = async () => {
  try {
    await fs.access(config.UPLOAD_PATH);
  } catch {
    await fs.mkdir(config.UPLOAD_PATH, { recursive: true });
  }
};

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    await ensureUploadDir();
    cb(null, config.UPLOAD_PATH);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req: any, file: any, cb: any) => {
  const ext = path.extname(file.originalname).toLowerCase().slice(1);
  
  if (allowedFileTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new ValidationError(`File type .${ext} is not allowed. Allowed types: ${allowedFileTypes.join(', ')}`));
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: config.UPLOAD_MAX_SIZE,
  },
  fileFilter,
});

// POST /api/upload/single
router.post('/single', upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ValidationError('No file uploaded');
  }

  const fileInfo = {
    filename: req.file.filename,
    originalName: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
    path: req.file.path,
    url: `/uploads/${req.file.filename}`,
  };

  logger.info('File uploaded', {
    ...fileInfo,
    uploadedBy: req.user?.id,
  });

  res.json({
    message: 'File uploaded successfully',
    file: fileInfo,
  });
}));

// POST /api/upload/multiple
router.post('/multiple', upload.array('files', 5), asyncHandler(async (req, res) => {
  const files = req.files as Express.Multer.File[];
  
  if (!files || files.length === 0) {
    throw new ValidationError('No files uploaded');
  }

  const filesInfo = files.map(file => ({
    filename: file.filename,
    originalName: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    path: file.path,
    url: `/uploads/${file.filename}`,
  }));

  logger.info('Multiple files uploaded', {
    count: files.length,
    files: filesInfo.map(f => f.originalName),
    uploadedBy: req.user?.id,
  });

  res.json({
    message: 'Files uploaded successfully',
    files: filesInfo,
  });
}));

// DELETE /api/upload/:filename
router.delete('/:filename', asyncHandler(async (req, res) => {
  const { filename } = req.params;
  
  // Validate filename (security check)
  if (!/^[\w\-. ]+$/.test(filename)) {
    throw new ValidationError('Invalid filename');
  }

  const filePath = path.join(config.UPLOAD_PATH, filename);

  try {
    await fs.access(filePath);
    await fs.unlink(filePath);

    logger.info('File deleted', {
      filename,
      deletedBy: req.user?.id,
    });

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    throw new ValidationError('File not found or already deleted');
  }
}));

// GET /api/upload/info
router.get('/info', (req, res) => {
  res.json({
    maxFileSize: config.UPLOAD_MAX_SIZE,
    maxFileSizeHuman: `${Math.round(config.UPLOAD_MAX_SIZE / 1024 / 1024)}MB`,
    allowedTypes: allowedFileTypes,
    uploadPath: config.UPLOAD_PATH,
  });
});

export default router;