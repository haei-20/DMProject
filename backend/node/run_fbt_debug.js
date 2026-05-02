require('dotenv').config();
const mongoose = require('mongoose');
const { getFrequentlyBoughtTogether } = require('./services/recommendationService');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/retail';

(async ()=>{
  try{
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const result = await getFrequentlyBoughtTogether(0.0001, 50, 5000);
    console.log('Result:', JSON.stringify(result, null, 2));

    await mongoose.disconnect();
  } catch(err){
    console.error('Error running FBT debug:', err);
    process.exit(1);
  }
})();