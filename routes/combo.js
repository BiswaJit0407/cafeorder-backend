const express = require("express")
const Combo = require("../models/Combo")
const auth = require("../middleware/auth")
const adminAuth = require("../middleware/adminAuth")

const router = express.Router()

// Get all active combos (public)
router.get("/", async (req, res) => {
  try {
    const combos = await Combo.find({ active: true }).sort({ createdAt: -1 })
    res.json(combos)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Get all combos including inactive (admin only)
router.get("/all", auth, adminAuth, async (req, res) => {
  try {
    const combos = await Combo.find().sort({ createdAt: -1 })
    res.json(combos)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Get combo by ID
router.get("/:id", async (req, res) => {
  try {
    const combo = await Combo.findById(req.params.id)
    if (!combo) {
      return res.status(404).json({ message: "Combo not found" })
    }
    res.json(combo)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Create combo (admin only)
router.post("/", auth, adminAuth, async (req, res) => {
  try {
    const { name, description, items, originalPrice, comboPrice, image } = req.body

    if (!name || !description || !items || !originalPrice || !comboPrice) {
      return res.status(400).json({ message: "All fields are required" })
    }

    if (items.length === 0) {
      return res.status(400).json({ message: "Combo must have at least one item" })
    }

    const combo = new Combo({
      name,
      description,
      items,
      originalPrice,
      comboPrice,
      image,
      active: true,
    })

    await combo.save()
    res.status(201).json({ message: "Combo created successfully", combo })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Update combo (admin only)
router.put("/:id", auth, adminAuth, async (req, res) => {
  try {
    const { name, description, items, originalPrice, comboPrice, image, active } = req.body

    const combo = await Combo.findByIdAndUpdate(
      req.params.id,
      { name, description, items, originalPrice, comboPrice, image, active },
      { new: true, runValidators: true }
    )

    if (!combo) {
      return res.status(404).json({ message: "Combo not found" })
    }

    res.json({ message: "Combo updated successfully", combo })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Toggle combo active status (admin only)
router.patch("/:id/toggle", auth, adminAuth, async (req, res) => {
  try {
    const combo = await Combo.findById(req.params.id)

    if (!combo) {
      return res.status(404).json({ message: "Combo not found" })
    }

    combo.active = !combo.active
    await combo.save()

    res.json({ message: `Combo ${combo.active ? "activated" : "deactivated"} successfully`, combo })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Delete combo (admin only)
router.delete("/:id", auth, adminAuth, async (req, res) => {
  try {
    const combo = await Combo.findByIdAndDelete(req.params.id)

    if (!combo) {
      return res.status(404).json({ message: "Combo not found" })
    }

    res.json({ message: "Combo deleted successfully" })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

module.exports = router
