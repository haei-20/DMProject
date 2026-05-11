const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const mongoose = require('mongoose');
const User = require('./models/User');

const MONGODB_URI = process.env.MONGO_URI;

async function createAdmin() {
  if (!MONGODB_URI) {
    console.error('Thiếu MONGO_URI trong file .env (backend/node/.env).');
    process.exit(1);
  }

  try {
    console.log('Đang kết nối MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Kết nối thành công!');

    const email = 'admin@example.com';
    const password = 'adminpassword123';

    const existing = await User.findOne({ email });
    if (existing) {
      if (existing.role === 'admin') {
        console.log('Tài khoản admin với email này đã tồn tại — không tạo thêm.');
      } else {
        console.log(
          `Email ${email} đã được dùng cho tài khoản role="${existing.role}".`
        );
        console.log(
          'Không thể tạo admin trùng email (schema User: email unique). Hãy đổi biến email trong script hoặc xóa/đổi user đó.'
        );
      }
      return;
    }

    const newAdmin = new User({
      name: 'Quản trị viên',
      email,
      password,
      role: 'admin',
      isVerified: true,
    });

    await newAdmin.save();
    console.log('Tạo tài khoản Admin thành công!');
    console.log(`Email đăng nhập: ${email}`);
    console.log(`Mật khẩu: ${password}`);
  } catch (error) {
    console.error('Lỗi:', error.message || error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('Đã ngắt kết nối database.');
  }
}

createAdmin();
