const mongoose = require("mongoose");

const guestCartSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
          default: 1,
        },
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 86400, // expires after 24 hours (in seconds)
    },
  }
);

module.exports = mongoose.model("GuestCart", guestCartSchema); 