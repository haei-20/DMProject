const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String },
    address: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      zipCode: { type: String },
      country: { type: String, default: "Vietnam" }
    },
    role: { 
      type: String, 
      enum: ["user", "admin", "guest"], 
      default: "user" 
    },
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String },
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date },
    otp: { type: String },
    otpExpires: { type: Date },
    lastLogin: { type: Date },
    avatar: { type: String },
    viewedProducts: [{ 
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      viewedAt: { type: Date, default: Date.now }
    }],
    wishlist: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Product' 
    }]
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Match password for login
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Check if user is admin
userSchema.methods.isAdmin = function() {
  return this.role === "admin";
};

// Create password reset token
userSchema.methods.createPasswordResetToken = function() {
  try {
    const resetToken = crypto.randomBytes(32).toString("hex");
    
    this.passwordResetToken = crypto
      .createHash("sha256")
      .update(resetToken || "")
      .digest("hex");
      
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    
    return resetToken;
  } catch (error) {
    console.error("Error creating password reset token:", error);
    return crypto.randomBytes(3).toString("hex"); // Fallback to a simpler token
  }
};

module.exports = mongoose.model("User", userSchema);
