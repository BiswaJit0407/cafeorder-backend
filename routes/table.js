const express = require("express")
const Table = require("../models/Table")
const Order = require("../models/Order")
const auth = require("../middleware/auth")
const adminAuth = require("../middleware/adminAuth")

const router = express.Router()

// Get table assigned to current user, if any
router.get("/my-table", auth, async (req, res) => {
  try {
    const table = await Table.findOne({ currentUserId: req.user.userId })
    res.json({ table })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Get all available tables (for users)
router.get("/available", auth, async (req, res) => {
  try {
    const tables = await Table.find({ status: "available" }).sort({ tableNumber: 1 })
    res.json(tables)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Get all tables (Admin only)
router.get("/all", auth, adminAuth, async (req, res) => {
  try {
    const tables = await Table.find().populate('currentUserId', 'name').sort({ tableNumber: 1 })
    res.json(tables)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Bulk setup tables (Admin only)
router.post("/setup", auth, adminAuth, async (req, res) => {
  try {
    const { totalTables } = req.body
    
    if (!totalTables || isNaN(totalTables) || totalTables < 1) {
      return res.status(400).json({ message: "Invalid total tables number" })
    }
    
    // Create missing tables
    for (let i = 1; i <= totalTables; i++) {
      const exists = await Table.findOne({ tableNumber: i })
      if (!exists) {
        await Table.create({ tableNumber: i, name: `Table ${i}` })
      }
    }
    
    // Delete tables > totalTables that are NOT occupied
    await Table.deleteMany({
      tableNumber: { $gt: totalTables },
      status: "available"
    })
    
    const tables = await Table.find().populate('currentUserId', 'name').sort({ tableNumber: 1 })
    res.json({ message: "Tables setup successfully", tables })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Create a table (Admin only)
router.post("/", auth, adminAuth, async (req, res) => {
  try {
    const { tableNumber, name } = req.body

    const existingTable = await Table.findOne({ tableNumber })
    if (existingTable) {
      return res.status(400).json({ message: "Table number already exists" })
    }

    const table = new Table({ tableNumber, name })
    await table.save()
    res.status(201).json({ message: "Table created successfully", table })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Update a table (Admin only)
router.put("/:id", auth, adminAuth, async (req, res) => {
  try {
    const { tableNumber, name } = req.body

    // Check if tableNumber is taken by another table
    const existingTable = await Table.findOne({ tableNumber, _id: { $ne: req.params.id } })
    if (existingTable) {
      return res.status(400).json({ message: "Table number already exists" })
    }

    const table = await Table.findByIdAndUpdate(
      req.params.id,
      { tableNumber, name },
      { new: true, runValidators: true }
    )

    if (!table) {
      return res.status(404).json({ message: "Table not found" })
    }

    res.json({ message: "Table updated successfully", table })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Delete a table (Admin only)
router.delete("/:id", auth, adminAuth, async (req, res) => {
  try {
    const table = await Table.findById(req.params.id)
    if (!table) {
      return res.status(404).json({ message: "Table not found" })
    }

    if (table.status === "occupied") {
      return res.status(400).json({ message: "Cannot delete an occupied table" })
    }

    await Table.findByIdAndDelete(req.params.id)
    res.json({ message: "Table deleted successfully" })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Admin forcibly free a table
router.post("/:id/free", auth, adminAuth, async (req, res) => {
  try {
    const table = await Table.findByIdAndUpdate(
      req.params.id,
      { status: "available", currentUserId: null },
      { new: true }
    )
    if (!table) return res.status(404).json({ message: "Table not found" })
    res.json({ message: "Table freed successfully", table })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

module.exports = router
