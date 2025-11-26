const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const dotenv = require("dotenv")
const path = require("path")

dotenv.config()

const app = express()

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/restaurant_order_system", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.log("MongoDB connection error:", err))

// Import Models
const User = require("./models/User")
const MenuItem = require("./models/MenuItem")
const Order = require("./models/Order")

// Import Routes
const authRoutes = require("./routes/auth")
const menuRoutes = require("./routes/menu")
const orderRoutes = require("./routes/order")
const analyticsRoutes = require("./routes/analytics")

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/menu", menuRoutes)
app.use("/api/orders", orderRoutes)
app.use("/api/analytics", analyticsRoutes)

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "Server is running" })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

module.exports = app
