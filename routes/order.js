const express = require("express")
const Order = require("../models/Order")
const User = require("../models/User")
const Notification = require("../models/Notification")
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
    const { tableNumber, items, specialInstructions, couponCode, discount, redeemPoints } = req.body

    // Fetch user details
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

    let loyaltyDiscount = 0
    let pointsToRedeem = 0
    if (redeemPoints && redeemPoints > 0) {
      const SystemSettings = require("../models/SystemSettings")
      const settings = await SystemSettings.findOne({ isGlobal: true })
      
      if (settings && settings.loyaltyEnabled) {
        if (user.loyaltyPoints < settings.minPointsToRedeem) {
          return res.status(400).json({ message: `Minimum ${settings.minPointsToRedeem} points required to redeem` })
        }
        if (redeemPoints > user.loyaltyPoints) {
          return res.status(400).json({ message: "Insufficient loyalty points" })
        }
        
        const maxMoneyDiscount = totalAmount * (settings.maxRedemptionPercentage / 100)
        const requestedMoneyDiscount = redeemPoints * settings.pointValue
        
        if (requestedMoneyDiscount > maxMoneyDiscount) {
           return res.status(400).json({ message: `Points can only cover up to ${settings.maxRedemptionPercentage}% of the bill` })
        }
        
        loyaltyDiscount = requestedMoneyDiscount
        pointsToRedeem = redeemPoints
      }
    }

    const finalAmount = totalAmount - (discount || 0) - loyaltyDiscount

    const Table = require("../models/Table")
    const table = await Table.findOne({ tableNumber })
    if (!table) {
      return res.status(400).json({ message: "Invalid table selected" })
    }

    if (table.status === "occupied" && table.currentUserId.toString() !== req.user.userId) {
      return res.status(400).json({ message: "This table is already occupied" })
    }

    if (table.status === "available") {
      table.status = "occupied"
      table.currentUserId = req.user.userId
      await table.save()
    }

    const order = new Order({
      user: req.user.userId,
      userName: user.name,
      tableNumber,
      items: orderItems,
      totalAmount,
      couponCode: couponCode || null,
      discount: (discount || 0) + loyaltyDiscount,
      finalAmount,
      specialInstructions: specialInstructions || "",
    })

    await order.save()
    
    if (pointsToRedeem > 0) {
      user.loyaltyPoints -= pointsToRedeem
      await user.save()
      
      const LoyaltyTransaction = require("../models/LoyaltyTransaction")
      await LoyaltyTransaction.create({
        user: user._id,
        points: -pointsToRedeem,
        type: "REDEEMED",
        orderId: order._id,
        description: `Redeemed points for order #${order._id.toString().substring(0, 8)}`
      })
    }
    
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

    // Notify admins
    try {
      const admins = await User.find({ role: "admin" })
      const io = req.app.get('io')
      const connectedUsers = req.app.get('connectedUsers')

      for (const admin of admins) {
        const notification = new Notification({
          userId: admin._id,
          title: "New Order",
          message: `Order #${order._id.toString().substring(0, 8)} placed by ${user.name} (Table ${tableNumber})`,
          type: "NEW_ORDER",
          link: "/admin-dashboard"
        })
        await notification.save()

        const socketId = connectedUsers.get(admin._id.toString())
        if (socketId && io) {
          io.to(socketId).emit("new_notification", notification)
        }
      }
    } catch (notifErr) {
      console.error("Error creating notification:", notifErr)
    }

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

    if (status === "paid" || status === "cancelled") {
      const activeOrders = await Order.countDocuments({ user: order.user._id, status: { $nin: ["paid", "cancelled"] } })
      if (activeOrders === 0) {
        const Table = require("../models/Table")
        await Table.updateMany({ currentUserId: order.user._id }, { status: "available", currentUserId: null })
      }
      
      // Loyalty Earning Logic
      if (status === "paid") {
        const SystemSettings = require("../models/SystemSettings")
        const settings = await SystemSettings.findOne({ isGlobal: true })
        
        if (settings && settings.loyaltyEnabled) {
          const pointsEarned = Math.floor(order.finalAmount / settings.spendPerPoint)
          if (pointsEarned > 0) {
            const userObj = await User.findById(order.user._id)
            if (userObj) {
              userObj.loyaltyPoints += pointsEarned
              await userObj.save()
              
              const LoyaltyTransaction = require("../models/LoyaltyTransaction")
              await LoyaltyTransaction.create({
                user: userObj._id,
                points: pointsEarned,
                type: "EARNED",
                orderId: order._id,
                description: `Earned points for order #${order._id.toString().substring(0, 8)}`
              })
            }
          }
        }
      }
    }

    // Notify user
    try {
      const io = req.app.get('io')
      const connectedUsers = req.app.get('connectedUsers')
      
      const notification = new Notification({
        userId: order.user._id,
        title: "Order Status Updated",
        message: `Your order is now: ${status.toUpperCase()}`,
        type: "ORDER_UPDATE",
        link: "/my-orders"
      })
      await notification.save()

      const socketId = connectedUsers.get(order.user._id.toString())
      if (socketId && io) {
        io.to(socketId).emit("new_notification", notification)
      }
    } catch (notifErr) {
      console.error("Error creating notification:", notifErr)
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

    const activeOrders = await Order.countDocuments({ user: order.user, status: { $nin: ["paid", "cancelled"] } })
    if (activeOrders === 0) {
      const Table = require("../models/Table")
      await Table.updateMany({ currentUserId: order.user }, { status: "available", currentUserId: null })
    }

    res.json({ message: "Order cancelled successfully", order })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

module.exports = router
