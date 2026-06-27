const express = require("express")
const SystemSettings = require("../models/SystemSettings")
const auth = require("../middleware/auth")
const adminAuth = require("../middleware/adminAuth")

const router = express.Router()

// Get global system settings (Admin only, or public for checkout config)
// We will make it auth so logged in users can see if loyalty is enabled for checkout
router.get("/", auth, async (req, res) => {
  try {
    let settings = await SystemSettings.findOne({ isGlobal: true })
    
    if (!settings) {
      settings = new SystemSettings()
      await settings.save()
    }
    
    // If not admin, only return necessary fields (don't return things users shouldn't see if any)
    res.json(settings)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Update global system settings (Admin only)
router.put("/", auth, adminAuth, async (req, res) => {
  try {
    const {
      loyaltyEnabled,
      spendPerPoint,
      pointValue,
      minPointsToRedeem,
      maxRedemptionPercentage
    } = req.body

    let settings = await SystemSettings.findOne({ isGlobal: true })
    if (!settings) {
      settings = new SystemSettings()
    }

    if (loyaltyEnabled !== undefined) settings.loyaltyEnabled = loyaltyEnabled
    if (spendPerPoint !== undefined) settings.spendPerPoint = spendPerPoint
    if (pointValue !== undefined) settings.pointValue = pointValue
    if (minPointsToRedeem !== undefined) settings.minPointsToRedeem = minPointsToRedeem
    if (maxRedemptionPercentage !== undefined) settings.maxRedemptionPercentage = maxRedemptionPercentage
    
    settings.updatedAt = Date.now()
    await settings.save()
    
    res.json({ message: "Settings updated successfully", settings })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

module.exports = router
