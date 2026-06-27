const mongoose = require("mongoose")

const loyaltyTransactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  points: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    enum: ["EARNED", "REDEEMED", "ADMIN_ADJUSTMENT"],
    required: true,
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    default: null, // Null if it's an admin adjustment
  },
  description: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

module.exports = mongoose.model("LoyaltyTransaction", loyaltyTransactionSchema)
