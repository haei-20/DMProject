require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/retail';

(async ()=>{
  try{
    await mongoose.connect(MONGO_URI, { maxPoolSize: 5 });
    const db = mongoose.connection.db;

    const ordersColl = db.collection('orders');
    const productsColl = db.collection('products');

    const totalOrders = await ordersColl.countDocuments();
    const ordersWith2Plus = await ordersColl.countDocuments({ 'orderItems.1': { $exists: true } });
    const nullProductCount = await ordersColl.countDocuments({ 'orderItems.product': null });

    console.log('Total orders:', totalOrders);
    console.log('Orders with >=2 items:', ordersWith2Plus);
    console.log('Orders with null product refs:', nullProductCount);

    console.log('\nSample orders with null product refs (up to 5):');
    const samples = await ordersColl.find({ 'orderItems.product': null }).limit(5).toArray();
    console.log(samples.map(o=>({ _id:o._id, guestInfo: o.guestInfo, items: o.orderItems.length })));

    console.log('\nTop 10 products by quantity:');
    const topByQty = await ordersColl.aggregate([
      { $unwind: '$orderItems' },
      { $group: { _id: '$orderItems.product', totalQty: { $sum: '$orderItems.qty' }, totalSales: { $sum: { $multiply: ['$orderItems.qty', '$orderItems.price'] } } } },
      { $sort: { totalQty: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
      { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
      { $project: { _id:0, productId: '$_id', sku: '$product.sku', name: '$product.name', totalQty:1, totalSales:1 } }
    ]).toArray();
    console.log(topByQty);

    console.log('\nTop 10 products by sales:');
    const topBySales = await ordersColl.aggregate([
      { $unwind: '$orderItems' },
      { $group: { _id: '$orderItems.product', totalSales: { $sum: { $multiply: ['$orderItems.qty', '$orderItems.price'] } }, totalQty: { $sum: '$orderItems.qty' } } },
      { $sort: { totalSales: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
      { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
      { $project: { _id:0, productId: '$_id', sku: '$product.sku', name: '$product.name', totalQty:1, totalSales:1 } }
    ]).toArray();
    console.log(topBySales);

    await mongoose.disconnect();
  } catch(err){
    console.error('Error during DB checks:', err);
    process.exit(1);
  }
})();