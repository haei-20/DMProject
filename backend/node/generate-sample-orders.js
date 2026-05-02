// generate-sample-orders.js
const mongoose = require('mongoose');

// Sử dụng chuỗi kết nối MongoDB Atlas
const MONGODB_URI = "mongodb+srv://dangthiha20012004_db_user:hRlbDYM2GnuC9NMd@haei.ludrqc2.mongodb.net/dmproject_db";


// Import models
const Order = require('./models/Order');
const Product = require('./models/Product');
const User = require('./models/User');

async function generateSampleOrders() {
  try {
    console.log('Kết nối tới MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Kết nối MongoDB Atlas thành công!');

    // Lấy danh sách sản phẩm hiện có
    const products = await Product.find({});
    console.log(`Tìm thấy ${products.length} sản phẩm trong database`);

    if (products.length === 0) {
      console.log('Không có sản phẩm nào trong database. Vui lòng thêm sản phẩm trước.');
      mongoose.disconnect();
      return;
    }

    // Thêm sau khi lấy danh sách sản phẩm
    console.log("Mẫu sản phẩm từ database:");
    for (let i = 0; i < Math.min(3, products.length); i++) {
      console.log(`ID: ${products[i]._id}, Tên: ${products[i].name}, Giá: ${products[i].price}`);
    }

    // Lấy một user làm người mua
    let user = await User.findOne({ role: 'user' });
    if (!user) {
      // Tạo một user mới nếu không có
      user = new User({
        name: 'Khách hàng mẫu',
        email: 'sample@example.com',
        password: '123456',
        role: 'user'
      });
      await user.save();
      console.log('Đã tạo user mẫu');
    }

    // Xóa đơn hàng cũ nếu cần
    console.log('Xóa đơn hàng cũ...');
    const deleteResult = await Order.deleteMany({});
    console.log(`Đã xóa ${deleteResult.deletedCount} đơn hàng cũ`);

    // Tạo các nhóm sản phẩm cố định để đảm bảo có pattern xuất hiện thường xuyên
    console.log('Tạo các nhóm sản phẩm cố định...');

    // Nhóm sản phẩm theo danh mục
    const productsByCategory = {};
    products.forEach(product => {
      if (product.category) {
        if (!productsByCategory[product.category]) {
          productsByCategory[product.category] = [];
        }
        productsByCategory[product.category].push(product);
      }
    });

    // Tạo các cụm sản phẩm xuất hiện cùng nhau thường xuyên
    const productClusters = [];

    // Cluster 1: Lấy 2 sản phẩm cố định từ mỗi danh mục nếu có
    for (const category in productsByCategory) {
      if (productsByCategory[category].length >= 2) {
        productClusters.push({
          name: `Nhóm ${category}`,
          products: productsByCategory[category].slice(0, 2),
          frequency: 40 // Số lần xuất hiện trong đơn hàng
        });
      }
    }

    // Cluster 2: Lấy các sản phẩm có giá cao nhất và thấp nhất
    if (products.length >= 4) {
      const sortedByPrice = [...products].sort((a, b) => a.price - b.price);
      productClusters.push({
        name: 'Nhóm giá cao-thấp',
        products: [sortedByPrice[0], sortedByPrice[sortedByPrice.length - 1]],
        frequency: 30
      });
    }

    // Cluster 3, 4, 5: Tạo thêm các cụm sản phẩm ngẫu nhiên nhưng cố định
    for (let i = 0; i < 3; i++) {
      if (products.length >= 3) {
        // Lấy ngẫu nhiên 2-3 sản phẩm
        const randomProducts = [];
        const usedIndexes = new Set();

        // Chọn ngẫu nhiên 2-3 sản phẩm không trùng lặp
        const numProducts = Math.min(products.length, Math.floor(Math.random() * 2) + 2); // 2-3 sản phẩm

        while (randomProducts.length < numProducts && usedIndexes.size < products.length) {
          const randomIndex = Math.floor(Math.random() * products.length);
          if (!usedIndexes.has(randomIndex)) {
            usedIndexes.add(randomIndex);
            randomProducts.push(products[randomIndex]);
          }
        }

        if (randomProducts.length >= 2) {
          productClusters.push({
            name: `Nhóm ngẫu nhiên ${i + 1}`,
            products: randomProducts,
            frequency: 20 + i * 5 // 20, 25, 30 lần xuất hiện
          });
        }
      }
    }

    console.log(`Đã tạo ${productClusters.length} nhóm sản phẩm cố định`);
    productClusters.forEach((cluster, index) => {
      console.log(`Nhóm ${index + 1}: ${cluster.name} - ${cluster.products.length} sản phẩm - tần suất ${cluster.frequency}`);
      cluster.products.forEach(product => {
        console.log(`  - ${product.name}`);
      });
    });

    // Tạo đơn hàng với các nhóm sản phẩm cố định
    console.log('Tạo đơn hàng với các nhóm sản phẩm cố định...');
    const sampleOrders = [];

    // 1. Tạo đơn hàng với từng nhóm sản phẩm cố định
    for (const cluster of productClusters) {
      for (let i = 0; i < cluster.frequency; i++) {
        // Tạo items cho đơn hàng
        const orderItems = cluster.products.map(product => ({
          product: product._id,
          name: product.name,
          qty: Math.floor(Math.random() * 2) + 1, // 1-2 sản phẩm
          price: product.price || Math.floor(Math.random() * 500000) + 50000,
          image: product.image || 'default-image.jpg'
        }));

        // Tính tổng tiền
        const totalPrice = orderItems.reduce((sum, item) => sum + item.price * item.qty, 0);

        // Trạng thái đơn hàng ngẫu nhiên
        const statuses = ['pending', 'placed', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'paid'];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

        // Ngày đặt hàng ngẫu nhiên trong 30 ngày gần đây
        const orderDate = new Date();
        orderDate.setDate(orderDate.getDate() - Math.floor(Math.random() * 30));

        // Tạo đơn hàng
        const order = new Order({
          user: user._id,
          orderItems: orderItems,
          shippingAddress: {
            address: '123 Đường mẫu',
            city: 'Thành phố mẫu',
            postalCode: '10000',
            country: 'Việt Nam'
          },
          paymentMethod: 'COD',
          totalPrice: totalPrice,
          status: randomStatus,
          isPaid: ['delivered', 'confirmed'].includes(randomStatus),
          paidAt: ['delivered', 'confirmed'].includes(randomStatus) ? orderDate : null,
          isDelivered: randomStatus === 'delivered',
          deliveredAt: randomStatus === 'delivered' ? orderDate : null,
          createdAt: orderDate
        });

        sampleOrders.push(order);
      }
    }

    // 2. Tạo thêm đơn hàng có sự kết hợp giữa các nhóm
    if (productClusters.length >= 2) {
      const combinationCount = 20; // Số đơn hàng kết hợp giữa các nhóm

      for (let i = 0; i < combinationCount; i++) {
        // Chọn ngẫu nhiên 2 nhóm
        const cluster1 = productClusters[Math.floor(Math.random() * productClusters.length)];
        let cluster2;
        do {
          cluster2 = productClusters[Math.floor(Math.random() * productClusters.length)];
        } while (cluster2 === cluster1);

        // Chọn 1 sản phẩm từ mỗi nhóm
        const product1 = cluster1.products[Math.floor(Math.random() * cluster1.products.length)];
        const product2 = cluster2.products[Math.floor(Math.random() * cluster2.products.length)];

        // Tạo items cho đơn hàng
        const orderItems = [
          {
            product: product1._id,
            name: product1.name,
            qty: Math.floor(Math.random() * 2) + 1,
            price: product1.price || Math.floor(Math.random() * 500000) + 50000,
            image: product1.image || 'default-image.jpg'
          },
          {
            product: product2._id,
            name: product2.name,
            qty: Math.floor(Math.random() * 2) + 1,
            price: product2.price || Math.floor(Math.random() * 500000) + 50000,
            image: product2.image || 'default-image.jpg'
          }
        ];

        // Tính tổng tiền
        const totalPrice = orderItems.reduce((sum, item) => sum + item.price * item.qty, 0);

        // Trạng thái đơn hàng ngẫu nhiên
        const statuses = ['pending', 'placed', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'paid'];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

        // Ngày đặt hàng ngẫu nhiên trong 30 ngày gần đây
        const orderDate = new Date();
        orderDate.setDate(orderDate.getDate() - Math.floor(Math.random() * 30));

        // Tạo đơn hàng
        const order = new Order({
          user: user._id,
          orderItems: orderItems,
          shippingAddress: {
            address: '123 Đường mẫu',
            city: 'Thành phố mẫu',
            postalCode: '10000',
            country: 'Việt Nam'
          },
          paymentMethod: 'COD',
          totalPrice: totalPrice,
          status: randomStatus,
          isPaid: ['delivered', 'confirmed'].includes(randomStatus),
          paidAt: ['delivered', 'confirmed'].includes(randomStatus) ? orderDate : null,
          isDelivered: randomStatus === 'delivered',
          deliveredAt: randomStatus === 'delivered' ? orderDate : null,
          createdAt: orderDate
        });

        sampleOrders.push(order);
      }
    }

    // 3. Tạo thêm một số đơn hàng ngẫu nhiên để tăng tính đa dạng
    const randomOrderCount = 30; // Số đơn hàng ngẫu nhiên

    for (let i = 0; i < randomOrderCount; i++) {
      // Chọn ngẫu nhiên 1-3 sản phẩm
      const productCount = Math.floor(Math.random() * 3) + 1;
      const orderProducts = [];
      const usedIndexes = new Set();

      while (orderProducts.length < productCount && usedIndexes.size < products.length) {
        const randomIndex = Math.floor(Math.random() * products.length);
        if (!usedIndexes.has(randomIndex)) {
          usedIndexes.add(randomIndex);
          orderProducts.push(products[randomIndex]);
        }
      }

      // Tạo items cho đơn hàng
      const orderItems = orderProducts.map(product => ({
        product: product._id,
        name: product.name,
        qty: Math.floor(Math.random() * 3) + 1,
        price: product.price || Math.floor(Math.random() * 500000) + 50000,
        image: product.image || 'default-image.jpg'
      }));

      // Tính tổng tiền
      const totalPrice = orderItems.reduce((sum, item) => sum + item.price * item.qty, 0);

      // Trạng thái đơn hàng ngẫu nhiên
      const statuses = ['pending', 'placed', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'paid'];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

      // Ngày đặt hàng ngẫu nhiên trong 30 ngày gần đây
      const orderDate = new Date();
      orderDate.setDate(orderDate.getDate() - Math.floor(Math.random() * 30));

      // Tạo đơn hàng
      const order = new Order({
        user: user._id,
        orderItems: orderItems,
        shippingAddress: {
          address: '123 Đường mẫu',
          city: 'Thành phố mẫu',
          postalCode: '10000',
          country: 'Việt Nam'
        },
        paymentMethod: 'COD',
        totalPrice: totalPrice,
        status: randomStatus,
        isPaid: ['delivered', 'confirmed'].includes(randomStatus),
        paidAt: ['delivered', 'confirmed'].includes(randomStatus) ? orderDate : null,
        isDelivered: randomStatus === 'delivered',
        deliveredAt: randomStatus === 'delivered' ? orderDate : null,
        createdAt: orderDate
      });

      sampleOrders.push(order);
    }

    // Lưu tất cả đơn hàng vào database
    console.log(`Lưu ${sampleOrders.length} đơn hàng vào database...`);

    // Thống kê các pattern xuất hiện
    const patternStats = {};
    sampleOrders.forEach(order => {
      const productIds = order.orderItems.map(item => item.product.toString()).sort();
      if (productIds.length >= 2) {
        const patternKey = productIds.join(',');
        patternStats[patternKey] = (patternStats[patternKey] || 0) + 1;
      }
    });

    // Hiển thị top 5 pattern phổ biến nhất
    console.log("Top 5 pattern sản phẩm phổ biến nhất:");
    Object.entries(patternStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([pattern, count], index) => {
        const productIds = pattern.split(',');
        const support = (count / sampleOrders.length).toFixed(4);
        console.log(`${index + 1}. Pattern: ${productIds.length} sản phẩm - ${count} đơn hàng - support: ${support}`);
      });

    await Order.insertMany(sampleOrders);

    console.log(`Đã tạo thành công ${sampleOrders.length} đơn hàng mẫu!`);

    // Đóng kết nối
    await mongoose.disconnect();
    console.log('Đã ngắt kết nối database');

  } catch (error) {
    console.error('Lỗi:', error);
    try {
      await mongoose.disconnect();
    } catch (err) {
      console.error('Lỗi khi ngắt kết nối:', err);
    }
  }
}

// Chạy hàm
generateSampleOrders();