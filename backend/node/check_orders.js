require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./models/Order');

(async ()=>{
  try{
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/retail');
    const c = await Order.countDocuments();
    console.log('Order count:', c);
    const o = await Order.findOne().lean();
    if(!o){
      console.log('No sample order found');
    } else {
      console.log('Sample keys:', Object.keys(o));
      console.log('guestInfo:', o.guestInfo);
      console.log('orderItems length:', (o.orderItems||[]).length);
    }
    await mongoose.disconnect();
  } catch(err){
    console.error(err);
    process.exit(1);
  }
})();