const mongoose = require("mongoose")

const systemSettingsSchema = new mongoose.Schema({
  // Only one document should exist for global settings
  isGlobal: {
    type: Boolean,
    default: true,
    unique: true
  },
  
  // Loyalty Program Settings
  loyaltyEnabled: {
    type: Boolean,
    default: false,
  },
  spendPerPoint: {
    type: Number,
    default: 100, // Spend 100 to get 1 point
  },
  pointValue: {
    type: Number,
    default: 1, // 1 point = 1 rupee discount
  },
  minPointsToRedeem: {
    type: Number,
    default: 50,
  },
  maxRedemptionPercentage: {
    type: Number,
    default: 50, // Points can cover up to 50% of the bill
    min: 1,
    max: 100
  },
  
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

module.exports = mongoose.model("SystemSettings", systemSettingsSchema)
