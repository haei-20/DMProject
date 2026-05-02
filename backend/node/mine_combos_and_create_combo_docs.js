require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./models/Order');
const Product = require('./models/Product');
const Combo = require('./models/Combo');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/retail';

async function run(){
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  // Build transactions: list of product IDs per order
  const orders = await Order.find({}).select('orderItems').lean();
  console.log('Loaded', orders.length, 'orders');

  const transactions = orders
    .map(o => (o.orderItems||[])
      .map(it => String(it.product))
      .filter(Boolean)
      .sort()
    )
    .filter(t => t.length > 1); // Keep only orders with 2+ items

  console.log('Valid transactions (2+ items):', transactions.length);

  // Simple frequent itemset mining: count co-occurrences
  const pairCounts = new Map();
  const itemCounts = new Map();
  let totalOrders = 0;

  for(const tx of transactions){
    totalOrders++;
    // Single item support
    for(const item of tx) itemCounts.set(item, (itemCounts.get(item)||0)+1);
    // Pair support
    for(let i=0; i<tx.length; i++){
      for(let j=i+1; j<tx.length; j++){
        const pair = [tx[i], tx[j]].sort().join('|');
        pairCounts.set(pair, (pairCounts.get(pair)||0)+1);
      }
    }
  }

  // Find pairs with support > 1% and confidence > 50%
  const minSupport = totalOrders * 0.01; // 1% of orders
  const goodPairs = [];

  for(const [pair, count] of pairCounts){
    if(count < minSupport) continue;
    const [p1, p2] = pair.split('|');
    const conf1 = count / itemCounts.get(p1); // confidence p2 given p1
    const conf2 = count / itemCounts.get(p2); // confidence p1 given p2
    if(conf1 > 0.5 || conf2 > 0.5){
      goodPairs.push({ p1, p2, count, support: count/totalOrders, conf: Math.max(conf1, conf2) });
    }
  }

  console.log('Found', goodPairs.length, 'high-confidence product pairs');
  goodPairs.sort((a,b) => b.conf - a.conf);

  // Create combos for top pairs
  let created = 0;
  for(const pair of goodPairs.slice(0,50)){ // limit to 50 combos
    try{
      const prodIds = [new mongoose.Types.ObjectId(pair.p1), new mongoose.Types.ObjectId(pair.p2)];
      const prods = await Product.find({ _id: { $in: prodIds } }).lean();
      if(prods.length < 2) continue;

      const name = 'Bundle: ' + prods.map(p=>p.name).join(' + ');
      const existing = await Combo.findOne({ name });
      if(existing) continue;

      const combo = new Combo({ 
        name, 
        description: `Auto-mined pair: support=${(pair.support*100).toFixed(2)}%, confidence=${(pair.conf*100).toFixed(2)}%`,
        products: prods.map(p=>({ _id: p._id, name: p.name, image: p.image, price: p.price })), 
        discount: 10, 
        isActive: true 
      });
      await combo.save();
      created++;
      if(created % 10 === 0) console.log('Created', created, 'combos');
    } catch(err){
      console.error('Error creating combo for pair', pair.p1, pair.p2, err.message);
    }
  }

  console.log('Created', created, 'combos total');
  await mongoose.disconnect();
}

run().catch(err=>{console.error(err); process.exit(1);});