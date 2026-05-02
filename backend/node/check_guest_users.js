require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

(async ()=>{
  try{
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/retail');
    const c = await User.countDocuments({ email: /^guest\./ });
    console.log('Guest user count:', c);
    const one = await User.findOne({ email: /^guest\./ }).lean();
    console.log('Sample guest user:', one ? { email: one.email, name: one.name } : null);
    await mongoose.disconnect();
  } catch(err){ console.error(err); process.exit(1);} 
})();