import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Upload folder path
const uploadDir = path.join(__dirname, '../../public/uploads')

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    const ext = path.extname(file.originalname)
    const nameWithoutExt = path.basename(file.originalname, ext)
    cb(null, nameWithoutExt + '-' + uniqueSuffix + ext)
  },
})

// File filter - only allow images
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Chỉ hỗ trợ các định dạng ảnh: JPEG, PNG, GIF, WebP, SVG'), false)
  }
}

// Create multer instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
})

// ── POST /api/upload/image  – Upload single image
router.post('/image', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Vui lòng chọn file ảnh' })
    }

    // Generate relative URL
    const imageUrl = `/uploads/${req.file.filename}`

    res.status(201).json({
      data: {
        url: imageUrl,
        filename: req.file.filename,
        size: req.file.size,
      },
      message: 'Tải lên ảnh thành công',
    })
  } catch (err) {
    console.error('[Upload image error]', err)
    res.status(500).json({ message: err.message || 'Lỗi tải lên ảnh' })
  }
})

// ── POST /api/upload/multiple  – Upload multiple images
router.post('/multiple', authMiddleware, upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'Vui lòng chọn ít nhất một file ảnh' })
    }

    const urls = req.files.map(file => ({
      url: `/uploads/${file.filename}`,
      filename: file.filename,
      size: file.size,
    }))

    res.status(201).json({
      data: urls,
      message: `Tải lên ${req.files.length} ảnh thành công`,
    })
  } catch (err) {
    console.error('[Upload multiple images error]', err)
    res.status(500).json({ message: err.message || 'Lỗi tải lên các ảnh' })
  }
})

export default router
