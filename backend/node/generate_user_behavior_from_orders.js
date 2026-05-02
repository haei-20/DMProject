require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./models/Order');
const UserBehavior = require('./models/UserBehavior');
const Product = require('./models/Product');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/retail';

async function run(){
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  // Pre-create/fetch all guest users needed
  const orders = await Order.find({}).select('guestInfo orderItems').lean();
  console.log('Loaded', orders.length, 'orders');

  const userMap = new Map(); // email -> userId
  const userSet = new Set();

  // Scan all orders to collect unique customer IDs
  for (const order of orders) {
    if (!order.guestInfo) continue;
    const email = (order.guestInfo.email || '').toLowerCase();
    const name = (order.guestInfo.name || '');
    let parsedId = null;

    const m = email.match(/^guest\.([0-9A-Za-z_-]+)@/);
    if (m) parsedId = m[1];
    else {
      const m2 = name.match(/Customer\s+([0-9A-Za-z_-]+)/i);
      if (m2) parsedId = m2[1];
    }

    if (parsedId) userSet.add(`guest.${parsedId}@example.com`);
  }

  // Bulk create missing users
  const existingUsers = await User.find({ email: { $in: Array.from(userSet) } }).select('_id email').lean();
  const existingEmails = new Set(existingUsers.map(u => u.email));
  existingUsers.forEach(u => userMap.set(u.email, u._id));

  const newUsers = [];
  for (const email of userSet) {
    if (!existingEmails.has(email)) {
      const custId = email.match(/^guest\.([0-9A-Za-z_-]+)@/)[1];
      const rawPassword = `imported_${custId}`;
      const hashedPassword = await bcrypt.hash(rawPassword, 10);
      newUsers.push({
        name: `Customer ${custId}`,
        email,
        password: hashedPassword,
        role: 'user',
        isVerified: true
      });
    }
  }

  let createdUsers = 0;
  if (newUsers.length > 0) {
    const inserted = await User.insertMany(newUsers, { ordered: false }).catch(e => []);
    createdUsers = inserted.length || 0;
    console.log('Created', createdUsers, 'new guest users');
    inserted.forEach(u => userMap.set(u.email, u._id));
  }

  // Build behavior docs in bulk
  const behaviorDocs = [];
  let processed = 0;

  for (const order of orders) {
    try {
      let userId = order.user || null;
      if (!userId && order.guestInfo) {
        const email = (order.guestInfo.email || '').toLowerCase();
        userId = userMap.get(email);
      }
      if (!userId) continue;

      for (const it of order.orderItems || []) {
        if (!it.product) continue;
        const ts = new Date(order.createdAt || order.invoiceDate || Date.now());
        ts.setMinutes(ts.getMinutes() - 5);
        behaviorDocs.push({
          user: userId,
          behaviors: [{
            type: 'view',
            product: it.product,
            timestamp: ts,
            metadata: { source: 'imported_order', deviceType: 'online' }
          }]
        });
      }
      processed++;
      if (processed % 1000 === 0) console.log('Queued behaviors for', processed, 'orders');
    } catch (err) {
      console.error('Error processing order', order._id, err.message);
    }
  }

  console.log('Total behavior docs to insert:', behaviorDocs.length);

  // Bulk insert behaviors
  if (behaviorDocs.length > 0) {
    const inserted = await UserBehavior.insertMany(behaviorDocs, { ordered: false }).catch(e => []);
    console.log('Inserted', inserted.length || 0, 'behavior documents');
  }

  console.log('Done. Total processed orders:', processed, 'Created users:', createdUsers);
  await mongoose.disconnect();
}

run().catch(err=>{console.error(err); process.exit(1);});