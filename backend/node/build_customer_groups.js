require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./models/Order');
const CustomerGroup = require('./models/CustomerGroup');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/retail';

async function run(){
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  // Aggregate by customer identifier field. Using Order.customer or Order.customerId depending on schema
  const groupField = 'customer';

  const agg = await Order.aggregate([
    { $match: { 'orderItems.0': { $exists: true } } },
    { $group: {
      _id: `$${groupField}`,
      totalSpent: { $sum: { $sum: { $map: { input: '$orderItems', as: 'it', in: { $multiply: ['$$it.qty', '$$it.price'] } } } } },
      orderCount: { $sum: 1 },
      avgOrderValue: { $avg: { $sum: { $map: { input: '$orderItems', as: 'it', in: { $multiply: ['$$it.qty', '$$it.price'] } } } } }
    }},
    { $sort: { totalSpent: -1 } }
  ]).allowDiskUse(true);

  console.log('Aggregated customers:', agg.length);

  // top 1% -> VIP, next 9% -> Loyal, others -> Standard
  const counts = agg.length;
  const vipCut = Math.max(1, Math.floor(counts * 0.01));
  const loyalCut = Math.max(1, Math.floor(counts * 0.10));

  const vipCustomers = agg.slice(0, vipCut);
  const loyalCustomers = agg.slice(vipCut, vipCut+loyalCut);

  async function upsertGroup(name, description, minSpend){
    let g = await CustomerGroup.findOne({ name });
    if(!g){
      g = new CustomerGroup({ name, description, discountPercentage: minSpend>1000?10:5, minimumOrder: minSpend });
      await g.save();
      console.log('Created group', name);
    } else {
      g.description = description;
      g.discountPercentage = minSpend>1000?10:5;
      g.minimumOrder = minSpend;
      await g.save();
      console.log('Updated group', name);
    }
  }

  // create groups
  await upsertGroup('VIP', 'Top 1% spenders', vipCustomers.length?vipCustomers[0].totalSpent:0);
  await upsertGroup('Loyal', 'Top 10% frequent/valuable customers', loyalCustomers.length?loyalCustomers[loyalCustomers.length-1].totalSpent:0);
  await upsertGroup('Standard', 'All other customers', 0);

  await mongoose.disconnect();
}

run().catch(err=>{console.error(err); process.exit(1);});