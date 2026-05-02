require('dotenv').config();
const mongoose = require('mongoose');
const Discount = require('./models/Discount');
const Coupon = require('./models/Coupon');
const Product = require('./models/Product');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/retail';

async function run(){
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  // Example: create a site-wide discount for clearance items (price < threshold)
  const cheapProducts = await Product.find({ price: { $lte: 5 } }).limit(50).select('_id');
  const cheapIds = cheapProducts.map(p=>p._id);

  let disc = await Discount.findOne({ name: 'Clearance Small Items' });
  if(!disc){
    disc = new Discount({ name: 'Clearance Small Items', description: '10% off on small priced items', discountType: 'percentage', discountValue: 10, applicableProducts: cheapIds });
    await disc.save();
    console.log('Created discount Clearance Small Items');
  } else {
    disc.applicableProducts = cheapIds;
    await disc.save();
    console.log('Updated discount Clearance');
  }

  // Create a coupon
  const until = new Date(); until.setMonth(until.getMonth()+1);
  let cp = await Coupon.findOne({ code: 'WELCOME10' });
  if(!cp){
    cp = new Coupon({ code: 'WELCOME10', description: '10% off for new users', discountType: 'percentage', discountValue: 10, minOrderValue: 20, validUntil: until });
    await cp.save();
    console.log('Created coupon WELCOME10');
  } else {
    cp.discountValue = 10; cp.minOrderValue = 20; cp.validUntil = until; await cp.save(); console.log('Updated coupon WELCOME10');
  }

  await mongoose.disconnect();
}

run().catch(err=>{console.error(err); process.exit(1);});