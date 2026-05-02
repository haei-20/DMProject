require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/retail');

    const importedFilter = { email: { $regex: /^guest\./i } };

    const totalImported = await User.countDocuments(importedFilter);
    const unverifiedImported = await User.countDocuments({ ...importedFilter, isVerified: false });
    const unhashedImported = await User.countDocuments({
      ...importedFilter,
      password: { $not: /^\$2[aby]\$/ }
    });

    console.log('totalImported', totalImported);
    console.log('unverifiedImported', unverifiedImported);
    console.log('unhashedImported', unhashedImported);

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();