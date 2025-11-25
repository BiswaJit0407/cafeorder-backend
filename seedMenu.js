const mongoose = require("mongoose")
const dotenv = require("dotenv")
const MenuItem = require("./models/MenuItem")

dotenv.config()

const sampleMenuItems = [
  {
    name: "Classic Burger",
    description: "Juicy beef patty with lettuce, tomato, onion, and special sauce",
    price: 299,
    category: "Main Course",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400",
    available: true,
  },
  {
    name: "Margherita Pizza",
    description: "Fresh mozzarella, tomato sauce, and basil on thin crust",
    price: 399,
    category: "Main Course",
    image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400",
    available: true,
  },
  {
    name: "Caesar Salad",
    description: "Crisp romaine lettuce with parmesan, croutons, and Caesar dressing",
    price: 199,
    category: "Appetizer",
    image: "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400",
    available: true,
  },
  {
    name: "French Fries",
    description: "Golden crispy fries with choice of dipping sauce",
    price: 129,
    category: "Appetizer",
    image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400",
    available: true,
  },
  {
    name: "Grilled Chicken",
    description: "Tender grilled chicken breast with herbs and vegetables",
    price: 349,
    category: "Main Course",
    image: "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400",
    available: true,
  },
  {
    name: "Pasta Carbonara",
    description: "Creamy pasta with bacon, egg, and parmesan cheese",
    price: 279,
    category: "Main Course",
    image: "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400",
    available: true,
  },
  {
    name: "Chocolate Lava Cake",
    description: "Warm chocolate cake with molten center, served with vanilla ice cream",
    price: 179,
    category: "Dessert",
    image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400",
    available: true,
  },
  {
    name: "Tiramisu",
    description: "Classic Italian dessert with coffee-soaked ladyfingers and mascarpone",
    price: 159,
    category: "Dessert",
    image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400",
    available: true,
  },
  {
    name: "Ice Cream Sundae",
    description: "Three scoops of ice cream with toppings and whipped cream",
    price: 149,
    category: "Dessert",
    image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400",
    available: true,
  },
  {
    name: "Fresh Orange Juice",
    description: "Freshly squeezed orange juice",
    price: 89,
    category: "Beverage",
    image: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400",
    available: true,
  },
  {
    name: "Cappuccino",
    description: "Espresso with steamed milk and foam",
    price: 119,
    category: "Beverage",
    image: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400",
    available: true,
  },
  {
    name: "Iced Coffee",
    description: "Cold brew coffee served over ice",
    price: 99,
    category: "Beverage",
    image: "https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=400",
    available: true,
  },
  {
    name: "Mango Smoothie",
    description: "Refreshing blend of mango, yogurt, and honey",
    price: 139,
    category: "Beverage",
    image: "https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=400",
    available: true,
  },
  {
    name: "Chef's Special Steak",
    description: "Premium ribeye steak cooked to perfection with sides",
    price: 599,
    category: "Special",
    image: "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=400",
    available: true,
  },
  {
    name: "Seafood Platter",
    description: "Assorted fresh seafood including prawns, fish, and calamari",
    price: 699,
    category: "Special",
    image: "https://images.unsplash.com/photo-1559737558-2f5a35f4523a?w=400",
    available: true,
  },
]

const seedMenuItems = async () => {
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

    // Clear existing menu items
    await MenuItem.deleteMany({})
    console.log("Cleared existing menu items")

    // Insert sample menu items
    const items = await MenuItem.insertMany(sampleMenuItems)
    console.log(`✓ Successfully added ${items.length} menu items!`)

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    console.log("Sample Menu Items by Category:")
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

    const categories = ["Appetizer", "Main Course", "Dessert", "Beverage", "Special"]
    categories.forEach((cat) => {
      const count = items.filter((item) => item.category === cat).length
      console.log(`${cat}: ${count} items`)
    })

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
    process.exit(0)
  } catch (error) {
    console.error("Error seeding menu items:", error.message)
    process.exit(1)
  }
}

seedMenuItems()
