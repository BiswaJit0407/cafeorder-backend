const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const dotenv = require("dotenv")
const http = require("http")
const { Server } = require("socket.io")

dotenv.config()

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: "*", // allow frontend origins
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
})

// Middleware
app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Make io accessible in routes
app.set('io', io)

// Store connected users mapping (userId -> socketId)
const connectedUsers = new Map()

io.on('connection', (socket) => {
  console.log(`New socket connection: ${socket.id}`)

  // When user logs in or connects, they register their userId
  socket.on('register', (userId) => {
    connectedUsers.set(userId, socket.id)
    console.log(`User ${userId} registered with socket ${socket.id}`)
  })

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`)
    // Find and remove the user from mapping
    for (const [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(userId)
        break
      }
    }
  })
})

// Expose connected users map to routes if needed
app.set('connectedUsers', connectedUsers)

// MongoDB Connection with proper configuration
mongoose.set('strictQuery', false)
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/restaurant_order_system", {
    serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
    socketTimeoutMS: 45000, // Socket timeout
    maxPoolSize: 10, // Connection pool size
    minPoolSize: 2,
    maxIdleTimeMS: 10000,
  })
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => {
    console.error("MongoDB connection error:", err)
    process.exit(1) // Exit if cannot connect to database
  })

// Handle MongoDB connection events
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB')
})

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err)
})

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected from MongoDB')
})

// Import Routes
const authRoutes = require("./routes/auth")
const menuRoutes = require("./routes/menu")
const orderRoutes = require("./routes/order")
const analyticsRoutes = require("./routes/analytics")
const uploadRoutes = require("./routes/upload")
const couponRoutes = require("./routes/coupon")
const reviewRoutes = require("./routes/review")
const specialOfferRoutes = require("./routes/specialOffer")
const notificationRoutes = require("./routes/notification")
const comboRoutes = require("./routes/combo")
const tableRoutes = require("./routes/table")
const settingsRoutes = require("./routes/settings")
const loyaltyRoutes = require("./routes/loyalty")

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/menu", menuRoutes)
app.use("/api/orders", orderRoutes)
app.use("/api/analytics", analyticsRoutes)
app.use("/api/upload", uploadRoutes)
app.use("/api/coupons", couponRoutes)
app.use("/api/reviews", reviewRoutes)
app.use("/api/special-offers", specialOfferRoutes)
app.use("/api/notifications", notificationRoutes)
app.use("/api/combos", comboRoutes)
app.use("/api/tables", tableRoutes)
app.use("/api/settings", settingsRoutes)
app.use("/api/loyalty", loyaltyRoutes)

// Root route
app.get("/", (_req, res) => {
  res.json({ message: "Server is running", success: true })
})

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ 
    status: "Server is running",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
  })
})


const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

module.exports = app
