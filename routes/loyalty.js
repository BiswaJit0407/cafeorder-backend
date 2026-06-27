const express = require("express")
const LoyaltyTransaction = require("../models/LoyaltyTransaction")
const User = require("../models/User")
const auth = require("../middleware/auth")

const router = express.Router()

// Get current user's loyalty transactions and balance
router.get("/my-loyalty", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("loyaltyPoints")
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    const transactions = await LoyaltyTransaction.find({ user: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(50) // Return last 50 transactions

    res.json({
      loyaltyPoints: user.loyaltyPoints,
      transactions
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

module.exports = router
