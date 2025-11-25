const mongoose = require("mongoose")
const dotenv = require("dotenv")
const User = require("./models/User")

dotenv.config()

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/restaurant_order_system",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    )
    console.log("MongoDB connected successfully")

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: "admin@cafe.com" })
    if (existingAdmin) {
      console.log("Admin account already exists!")
      console.log("Email:", existingAdmin.email)
      console.log("To reset password, delete this user from database first")
      process.exit(0)
    }

    // Create admin user
    const admin = new User({
      name: "Admin",
      email: "admin@cafe.com",
      password: "admin123", // Change this password after first login
      role: "admin",
      tableNumber: null,
    })

    await admin.save()

    console.log("✓ Admin account created successfully!")
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    console.log("Email:    admin@cafe.com")
    console.log("Password: admin123")
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    console.log("⚠️  IMPORTANT: Change this password after first login!")

    process.exit(0)
  } catch (error) {
    console.error("Error creating admin:", error.message)
    process.exit(1)
  }
}

createAdmin()
