const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const MONGODB_URI = "mongodb+srv://dangthiha20012004_db_user:hRlbDYM2GnuC9NMd@haei.ludrqc2.mongodb.net/dmproject_db?appName=haei";

async function createAdmin() {
  try {
    console.log('Đang kết nối tới MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI);
    console.log('Kết nối thành công!');

    const email = 'admin@example.com';
    const password = 'adminpassword123'; // Mật khẩu mặc định
    
    // Kiểm tra xem đã có admin này chưa
    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      console.log('Tài khoản admin này đã tồn tại!');
    } else {
      // Tạo tài khoản admin mới
      const newAdmin = new User({
        name: 'Quản trị viên',
        email: email,
        password: password,
        role: 'admin',
        isVerified: true
      });

      await newAdmin.save();
      console.log(`Tạo tài khoản Admin thành công!`);
      console.log(`Email đăng nhập: ${email}`);
      console.log(`Mật khẩu: ${password}`);
    }

  } catch (error) {
    console.error('Lỗi:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Đã ngắt kết nối database.');
  }
}

createAdmin();
