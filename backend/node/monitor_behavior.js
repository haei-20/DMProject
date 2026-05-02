require('dotenv').config();
const mongoose = require('mongoose');
const UserBehavior = require('./models/UserBehavior');
const User = require('./models/User');

(async ()=>{
  try{
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/retail');
    const ubCount = await UserBehavior.countDocuments();
    const userCount = await User.countDocuments({ role: 'guest' });
    console.log(`UserBehavior records: ${ubCount}`);
    console.log(`Guest users created: ${userCount}`);
    await mongoose.disconnect();
  } catch(err){ console.error(err); process.exit(1);} 
})();