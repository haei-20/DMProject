require('dotenv').config();
const mongoose = require('mongoose');
const UserBehavior = require('./models/UserBehavior');

(async ()=>{
  try{
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/retail');
    const deleted = await UserBehavior.deleteMany({});
    console.log('Deleted', deleted.deletedCount, 'UserBehavior records');
    await mongoose.disconnect();
  } catch(err){ console.error(err); process.exit(1);} 
})();