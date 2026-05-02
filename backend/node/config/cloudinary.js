const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Tạo thư mục uploads nếu chưa tồn tại
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Kiểm tra xem có biến môi trường cho Cloudinary không
const hasCloudinaryConfig = process.env.CLOUDINARY_CLOUD_NAME && 
                           process.env.CLOUDINARY_API_KEY && 
                           process.env.CLOUDINARY_API_SECRET;

let storage;
let upload;

if (hasCloudinaryConfig) {
  // Sử dụng Cloudinary nếu có cấu hình
  console.log('Configuring Cloudinary storage');
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });

  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'retail-products',
      format: async (req, file) => 'png', // hoặc 'jpeg'
      public_id: (req, file) => `product-${Date.now()}`
    }
  });

  upload = multer({ storage: storage });
} else {
  // Sử dụng lưu trữ cục bộ nếu không có Cloudinary
  console.log('Configuring local disk storage (Cloudinary config not found)');
  const diskStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, 'product-' + uniqueSuffix + ext);
    }
  });

  upload = multer({ storage: diskStorage });
}

module.exports = {
  cloudinary: hasCloudinaryConfig ? cloudinary : null,
  upload,
  uploadDir,
  hasCloudinaryConfig
}; 