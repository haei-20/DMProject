const mongoose = require('mongoose');
const Category = require('./models/Category');

const MONGODB_URI = "mongodb+srv://dangthiha20012004_db_user:hRlbDYM2GnuC9NMd@haei.ludrqc2.mongodb.net/dmproject";

async function generateSampleCategories() {
  try {
    console.log('Kết nối tới MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Kết nối thành công!');

    // Xóa tất cả categories cũ (nếu muốn làm sạch)
    console.log('Xóa danh mục cũ...');
    const deleteResult = await Category.deleteMany({});
    console.log(`Đã xóa ${deleteResult.deletedCount} danh mục cũ`);

    // Dữ liệu danh mục mẫu
    const sampleCategories = [
      {
        name: 'Sữa các loại',
        description: 'Sữa tươi, sữa chua, sữa ngoài',
        imageUrl: 'https://via.placeholder.com/300x300?text=Milk',
        isActive: true,
        order: 1
      },
      {
        name: 'Rau - Củ - Trái Cây',
        description: 'Rau xanh, cải, cà chua, trái cây tươi',
        imageUrl: 'https://via.placeholder.com/300x300?text=Vegetables',
        isActive: true,
        order: 2
      },
      {
        name: 'Hóa Phẩm - Tẩy rửa',
        description: 'Nước rửa chén, xà phòng, chất tẩy rửa',
        imageUrl: 'https://via.placeholder.com/300x300?text=Cleaning',
        isActive: true,
        order: 3
      },
      {
        name: 'Chăm Sóc Cá Nhân',
        description: 'Xà bông, kem đánh răng, dầu gội',
        imageUrl: 'https://via.placeholder.com/300x300?text=Personal+Care',
        isActive: true,
        order: 4
      },
      {
        name: 'Văn phòng phẩm - Đồ chơi',
        description: 'Bút chì, bút bi, sổ, đồ chơi giáo dục',
        imageUrl: 'https://via.placeholder.com/300x300?text=Office+Toys',
        isActive: true,
        order: 5
      },
      {
        name: 'Bánh Kẹo',
        description: 'Bánh mì, bánh quy, kẹo, socola',
        imageUrl: 'https://via.placeholder.com/300x300?text=Sweets',
        isActive: true,
        order: 6
      },
      {
        name: 'Đồ uống - Giải khát',
        description: 'Nước cam, trà, cà phê, nước lọc',
        imageUrl: 'https://via.placeholder.com/300x300?text=Beverages',
        isActive: true,
        order: 7
      },
      {
        name: 'Mì - Thực Phẩm Ăn Liền',
        description: 'Mì tôm, mì spaghetti, thực phẩm ăn liền',
        imageUrl: 'https://via.placeholder.com/300x300?text=Instant+Food',
        isActive: true,
        order: 8
      }
    ];

    // Thêm createdAt và updatedAt
    sampleCategories.forEach(category => {
      category.createdAt = new Date();
      category.updatedAt = new Date();
    });

    // Lưu danh mục vào database
    console.log(`Đang lưu ${sampleCategories.length} danh mục vào database...`);
    const createdCategories = await Category.insertMany(sampleCategories);
    
    console.log(`✅ Đã tạo thành công ${createdCategories.length} danh mục!`);
    console.log('\nDanh sách danh mục:');
    createdCategories.forEach((category, index) => {
      console.log(`${index + 1}. ${category.name} (slug: ${category.slug})`);
    });

  } catch (error) {
    console.error('Lỗi:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\nĐã ngắt kết nối database.');
  }
}

generateSampleCategories();
