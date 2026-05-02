const express = require('express');
const path = require('path');
const { upload, cloudinary, uploadDir, hasCloudinaryConfig } = require('../config/cloudinary');
const { protect, isAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

// Upload single image
router.post('/image', protect, isAdmin, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Không tìm thấy file hình ảnh'
      });
    }
    
    // Trả về kết quả phù hợp với loại lưu trữ đang sử dụng
    if (hasCloudinaryConfig) {
      // Trả về URL Cloudinary
      res.json({
        success: true,
        imageUrl: req.file.path,
        publicId: req.file.filename
      });
    } else {
      // Trả về URL cục bộ (đường dẫn tương đối)
      const relativePath = `/uploads/${path.basename(req.file.path)}`;
      res.json({
        success: true,
        imageUrl: relativePath,
        publicId: path.basename(req.file.path)
      });
    }
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tải lên hình ảnh',
      error: error.message
    });
  }
});

// Serve uploaded files from the uploads directory
router.use('/uploads', express.static(uploadDir));

// Xoá hình ảnh
router.delete('/image/:publicId', protect, isAdmin, async (req, res) => {
  try {
    if (hasCloudinaryConfig) {
      // Xóa từ Cloudinary
      const result = await cloudinary.uploader.destroy(req.params.publicId);
      res.json({ 
        success: result.result === 'ok',
        message: result.result === 'ok' ? 'Đã xóa hình ảnh' : 'Không thể xóa hình ảnh',
        result
      });
    } else {
      // Xóa file cục bộ
      const filePath = path.join(uploadDir, req.params.publicId);
      require('fs').unlinkSync(filePath);
      res.json({ 
        success: true,
        message: 'Đã xóa hình ảnh'
      });
    }
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa hình ảnh',
      error: error.message
    });
  }
});

// Route kiểm tra kết nối Cloudinary
router.get('/status', async (req, res) => {
  try {
    if (hasCloudinaryConfig) {
      const result = await cloudinary.api.ping();
      res.json({
        success: true,
        message: 'Cloudinary đang hoạt động',
        result
      });
    } else {
      res.json({
        success: true,
        message: 'Đang sử dụng lưu trữ cục bộ (không có Cloudinary)',
        uploadDir
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi kiểm tra kết nối',
      error: error.message
    });
  }
});

module.exports = router; 