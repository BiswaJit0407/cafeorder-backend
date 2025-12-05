const express = require("express")
const Order = require("../models/Order")
const auth = require("../middleware/auth")
const adminAuth = require("../middleware/adminAuth")

const router = express.Router()

// Get all orders (Admin only)
router.get("/", auth, adminAuth, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email tableNumber")
      .populate("items.menuItem", "name price")
      .sort({ createdAt: -1 })

    res.json(orders)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Get orders by status (Admin only)
router.get("/status/:status", auth, adminAuth, async (req, res) => {
  try {
    const { status } = req.params
    const orders = await Order.find({ status })
      .populate("user", "name email tableNumber")
      .populate("items.menuItem", "name price")
      .sort({ createdAt: -1 })

    res.json(orders)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Get user's orders
router.get("/my-orders", auth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.userId })
      .populate("items.menuItem", "name price image")
      .sort({ createdAt: -1 })

    res.json(orders)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Get order by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "name email tableNumber")
      .populate("items.menuItem", "name price image")

    if (!order) {
      return res.status(404).json({ message: "Order not found" })
    }

    // Users can only view their own orders, admins can view all
    if (req.user.role !== "admin" && order.user._id.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Access denied" })
    }

    res.json(order)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Create new order
router.post("/", auth, async (req, res) => {
  try {
    const { tableNumber, items, specialInstructions, couponCode, discount } = req.body

    // Fetch user details
    const User = require("../models/User")
    const user = await User.findById(req.user.userId)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Fetch menu items to get prices and calculate total
    const MenuItem = require("../models/MenuItem")
    const orderItems = []
    let totalAmount = 0

    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menuItemId)
      if (!menuItem) {
        return res.status(404).json({ message: `Menu item not found: ${item.menuItemId}` })
      }

      const itemTotal = menuItem.price * item.quantity
      totalAmount += itemTotal

      orderItems.push({
        menuItem: menuItem._id,
        name: menuItem.name,
        quantity: item.quantity,
        price: menuItem.price,
      })
    }

    const finalAmount = totalAmount - (discount || 0)

    const order = new Order({
      user: req.user.userId,
      userName: user.name,
      tableNumber,
      items: orderItems,
      totalAmount,
      couponCode: couponCode || null,
      discount: discount || 0,
      finalAmount,
      specialInstructions: specialInstructions || "",
    })

    await order.save()
    
    // If coupon was used, increment its usage count
    if (couponCode) {
      const Coupon = require("../models/Coupon")
      await Coupon.findOneAndUpdate(
        { code: couponCode.toUpperCase() },
        { $inc: { usedCount: 1 } }
      )
    }
    
    // Populate with full details for response
    await order.populate("user", "name email")
    await order.populate("items.menuItem", "name price image")

    res.status(201).json({ message: "Order placed successfully", order })
  } catch (error) {
    console.error("Order creation error:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Update order status (Admin only)
router.put("/:id/status", auth, adminAuth, async (req, res) => {
  try {
    const { status } = req.body

    const validStatuses = ["pending", "preparing", "ready", "served", "paid", "cancelled"]
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" })
    }

    const order = await Order.findByIdAndUpdate(req.params.id, { status, updatedAt: Date.now() }, { new: true })
      .populate("user", "name email tableNumber")
      .populate("items.menuItem", "name price")

    if (!order) {
      return res.status(404).json({ message: "Order not found" })
    }

    res.json({ message: "Order status updated successfully", order })
  } catch (error) {
    console.error("Status update error:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Cancel order
router.patch("/:id/cancel", auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)

    if (!order) {
      return res.status(404).json({ message: "Order not found" })
    }

    // Users can only cancel their own orders
    if (req.user.role !== "admin" && order.user.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Access denied" })
    }

    // Can only cancel pending or preparing orders
    if (!["pending", "preparing"].includes(order.status)) {
      return res.status(400).json({ message: "Cannot cancel this order" })
    }

    order.status = "cancelled"
    order.updatedAt = Date.now()
    await order.save()

    res.json({ message: "Order cancelled successfully", order })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

module.exports = router
