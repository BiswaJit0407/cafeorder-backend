const express = require("express")
const MenuItem = require("../models/MenuItem")
const auth = require("../middleware/auth")
const adminAuth = require("../middleware/adminAuth")

const router = express.Router()

// Get all menu items (only available ones for users)
router.get("/", async (req, res) => {
  try {
    const menuItems = await MenuItem.find({ available: true }).sort({ category: 1, name: 1 })
    res.json(menuItems)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Get all menu items including unavailable (Admin only)
router.get("/all", auth, adminAuth, async (req, res) => {
  try {
    const menuItems = await MenuItem.find().sort({ category: 1, name: 1 })
    res.json(menuItems)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Get menu item by ID
router.get("/:id", async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id)
    if (!menuItem) {
      return res.status(404).json({ message: "Menu item not found" })
    }
    res.json(menuItem)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Create menu item (Admin only)
router.post("/", auth, adminAuth, async (req, res) => {
  try {
    const { name, description, price, category, image, available } = req.body

    const menuItem = new MenuItem({
      name,
      description,
      price,
      category,
      image,
      available,
    })

    await menuItem.save()
    res.status(201).json({ message: "Menu item created successfully", menuItem })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Update menu item (Admin only)
router.put("/:id", auth, adminAuth, async (req, res) => {
  try {
    const { name, description, price, category, image, available } = req.body

    const menuItem = await MenuItem.findByIdAndUpdate(
      req.params.id,
      { name, description, price, category, image, available },
      { new: true, runValidators: true }
    )

    if (!menuItem) {
      return res.status(404).json({ message: "Menu item not found" })
    }

    res.json({ message: "Menu item updated successfully", menuItem })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Delete menu item (Admin only)
router.delete("/:id", auth, adminAuth, async (req, res) => {
  try {
    const menuItem = await MenuItem.findByIdAndDelete(req.params.id)

    if (!menuItem) {
      return res.status(404).json({ message: "Menu item not found" })
    }

    res.json({ message: "Menu item deleted successfully" })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

module.exports = router
