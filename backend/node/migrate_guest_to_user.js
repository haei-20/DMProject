require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/retail');

    const before = await User.countDocuments({ role: 'guest' });
    const result = await User.updateMany(
      { role: 'guest' },
      { $set: { role: 'user' } }
    );
    const after = await User.countDocuments({ role: 'guest' });

    console.log('Guests before:', before);
    console.log('Modified:', result.modifiedCount || 0);
    console.log('Guests after:', after);

    await mongoose.disconnect();
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
})();