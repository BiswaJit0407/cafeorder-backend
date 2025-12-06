const mongoose = require("mongoose")
const dotenv = require("dotenv")

dotenv.config()

const SpecialOffer = require("./models/SpecialOffer")
const MenuItem = require("./models/MenuItem")

async function migrateSpecialOffers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/restaurant_order_system")
    console.log("Connected to MongoDB")

    // Find all special offers that don't have a menuItemId
    const offersWithoutMenuItem = await SpecialOffer.find({
      $or: [{ menuItemId: null }, { menuItemId: { $exists: false } }],
    })

    console.log(`Found ${offersWithoutMenuItem.length} special offers without menu items`)

    for (const offer of offersWithoutMenuItem) {
      console.log(`Creating menu item for: ${offer.name}`)

      // Create a corresponding menu item
      const menuItem = new MenuItem({
        name: offer.name,
        description: `${offer.description} (Special Offer)`,
        price: offer.offerPrice,
        category: "Special",
        image: offer.image || "https://via.placeholder.com/300",
        available: offer.active,
        isSpecialOffer: true,
        specialOfferId: offer._id,
      })

      await menuItem.save()

      // Update the special offer with the menu item reference
      offer.menuItemId = menuItem._id
      await offer.save()

      console.log(`✓ Created menu item ${menuItem._id} for special offer ${offer._id}`)
    }

    console.log("\n✅ Migration completed successfully!")
    console.log(`Total special offers migrated: ${offersWithoutMenuItem.length}`)
  } catch (error) {
    console.error("❌ Migration failed:", error)
  } finally {
    await mongoose.connection.close()
    console.log("Database connection closed")
  }
}

// Run the migration
migrateSpecialOffers()
