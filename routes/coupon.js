const express = require("express")
const Coupon = require("../models/Coupon")
const auth = require("../middleware/auth")
const adminAuth = require("../middleware/adminAuth")

const router = express.Router()

// Get all active coupons (for users)
router.get("/active", auth, async (req, res) => {
  try {
    const now = new Date()
    const coupons = await Coupon.find({
      active: true,
      validFrom: { $lte: now },
      validUntil: { $gte: now },
    }).select("-usedCount")

    res.json(coupons)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Validate and apply coupon
router.post("/validate", auth, async (req, res) => {
  try {
    const { code, orderAmount } = req.body

    const coupon = await Coupon.findOne({ code: code.toUpperCase() })

    if (!coupon) {
      return res.status(404).json({ message: "Invalid coupon code" })
    }

    if (!coupon.active) {
      return res.status(400).json({ message: "This coupon is no longer active" })
    }

    const now = new Date()
    if (now < coupon.validFrom || now > coupon.validUntil) {
      return res.status(400).json({ message: "This coupon has expired" })
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ message: "This coupon has reached its usage limit" })
    }

    if (orderAmount < coupon.minOrderAmount) {
      return res.status(400).json({
        message: `Minimum order amount of ₹${coupon.minOrderAmount} required`,
      })
    }

    let discount = 0
    if (coupon.discountType === "percentage") {
      discount = (orderAmount * coupon.discountValue) / 100
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount
      }
    } else {
      discount = coupon.discountValue
    }

    res.json({
      valid: true,
      coupon: {
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
      },
      discount: Math.round(discount),
      finalAmount: Math.round(orderAmount - discount),
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Get all coupons (Admin only)
router.get("/", auth, adminAuth, async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 })
    res.json(coupons)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Create coupon (Admin only)
router.post("/", auth, adminAuth, async (req, res) => {
  try {
    const coupon = new Coupon(req.body)
    await coupon.save()
    res.status(201).json({ message: "Coupon created successfully", coupon })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Coupon code already exists" })
    }
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Update coupon (Admin only)
router.put("/:id", auth, adminAuth, async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })

    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" })
    }

    res.json({ message: "Coupon updated successfully", coupon })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Delete coupon (Admin only)
router.delete("/:id", auth, adminAuth, async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id)

    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" })
    }

    res.json({ message: "Coupon deleted successfully" })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Increment usage count (called when order is placed)
router.post("/:id/use", auth, async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      { $inc: { usedCount: 1 } },
      { new: true }
    )

    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" })
    }

    res.json({ message: "Coupon usage recorded" })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

module.exports = router
