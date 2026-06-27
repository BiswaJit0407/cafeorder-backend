const express = require("express")
const router = express.Router()
const Combo = require("../models/Combo")
const auth = require("../middleware/auth")
const adminAuth = require("../middleware/adminAuth")

// Get all combos
router.get("/all", auth, async (req, res) => {
  try {
    const combos = await Combo.find().sort({ createdAt: -1 })
    res.json(combos)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Create a new combo
router.post("/", auth, adminAuth, async (req, res) => {
  try {
    const combo = new Combo(req.body)
    await combo.save()
    res.status(201).json(combo)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// Update a combo
router.put("/:id", auth, adminAuth, async (req, res) => {
  try {
    const combo = await Combo.findById(req.params.id)
    if (!combo) {
      return res.status(404).json({ message: "Combo not found" })
    }
    
    Object.assign(combo, req.body)
    await combo.save()
    res.json(combo)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// Toggle combo status
router.patch("/:id/toggle", auth, adminAuth, async (req, res) => {
  try {
    const combo = await Combo.findById(req.params.id)
    if (!combo) {
      return res.status(404).json({ message: "Combo not found" })
    }
    
    combo.active = !combo.active
    await combo.save()
    res.json(combo)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// Delete a combo
router.delete("/:id", auth, adminAuth, async (req, res) => {
  try {
    const combo = await Combo.findByIdAndDelete(req.params.id)
    if (!combo) {
      return res.status(404).json({ message: "Combo not found" })
    }
    res.json({ message: "Combo deleted successfully" })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
