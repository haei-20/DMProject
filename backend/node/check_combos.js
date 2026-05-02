require('dotenv').config();
const mongoose = require('mongoose');
const Combo = require('./models/Combo');

(async ()=>{
  try{
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/retail');
    const count = await Combo.countDocuments();
    console.log('Combo count:', count);
    const samples = await Combo.find().limit(3).lean();
    samples.forEach((c, idx) => console.log(`Combo ${idx+1}: ${c.name} (${c.products.length} items)`));
    await mongoose.disconnect();
  } catch(err){ console.error(err); process.exit(1);} 
})();