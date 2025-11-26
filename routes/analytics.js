const express = require("express")
const Order = require("../models/Order")
const auth = require("../middleware/auth")
const adminAuth = require("../middleware/adminAuth")

const router = express.Router()

// Get analytics data
router.get("/", auth, adminAuth, async (req, res) => {
  try {
    const { period } = req.query // daily, weekly, monthly, yearly

    const now = new Date()
    let startDate

    switch (period) {
      case "daily":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case "weekly":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case "monthly":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case "yearly":
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    }

    // Get orders for the period
    const orders = await Order.find({
      createdAt: { $gte: startDate },
    })

    // Calculate statistics
    const totalOrders = orders.length
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0)
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Orders by status
    const ordersByStatus = {
      pending: orders.filter((o) => o.status === "pending").length,
      preparing: orders.filter((o) => o.status === "preparing").length,
      ready: orders.filter((o) => o.status === "ready").length,
      served: orders.filter((o) => o.status === "served").length,
      paid: orders.filter((o) => o.status === "paid").length,
      cancelled: orders.filter((o) => o.status === "cancelled").length,
    }

    // Top selling items
    const itemCounts = {}
    orders.forEach((order) => {
      order.items.forEach((item) => {
        if (itemCounts[item.name]) {
          itemCounts[item.name].quantity += item.quantity
          itemCounts[item.name].revenue += item.price * item.quantity
        } else {
          itemCounts[item.name] = {
            name: item.name,
            quantity: item.quantity,
            revenue: item.price * item.quantity,
          }
        }
      })
    })

    const topItems = Object.values(itemCounts)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10)

    // Revenue by day (for charts)
    const revenueByDay = {}
    orders.forEach((order) => {
      const date = new Date(order.createdAt).toLocaleDateString()
      if (revenueByDay[date]) {
        revenueByDay[date] += order.totalAmount
      } else {
        revenueByDay[date] = order.totalAmount
      }
    })

    res.json({
      period,
      startDate,
      endDate: now,
      totalOrders,
      totalRevenue,
      averageOrderValue,
      ordersByStatus,
      topItems,
      revenueByDay,
    })
  } catch (error) {
    console.error("Analytics error:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

module.exports = router
