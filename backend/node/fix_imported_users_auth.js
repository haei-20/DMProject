require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/retail';

(async () => {
  try {
    await mongoose.connect(MONGO_URI);

    const importedFilter = { email: { $regex: /^guest\./i } };

    const verifyResult = await User.updateMany(
      { ...importedFilter, isVerified: false },
      { $set: { isVerified: true, otp: undefined, otpExpires: undefined, verificationToken: undefined } }
    );

    const unhashedUsers = await User.find({
      ...importedFilter,
      password: { $not: /^\$2[aby]\$/ }
    }).select('_id password').lean();

    const bulkOps = [];
    for (const u of unhashedUsers) {
      const hashed = await bcrypt.hash(u.password, 10);
      bulkOps.push({
        updateOne: {
          filter: { _id: u._id },
          update: { $set: { password: hashed } }
        }
      });
    }

    let hashedCount = 0;
    if (bulkOps.length > 0) {
      const result = await User.bulkWrite(bulkOps, { ordered: false });
      hashedCount = result.modifiedCount || 0;
    }

    console.log('verifiedUpdated', verifyResult.modifiedCount || 0);
    console.log('passwordHashedUpdated', hashedCount);

    await mongoose.disconnect();
  } catch (err) {
    console.error('Fix failed:', err);
    process.exit(1);
  }
})();