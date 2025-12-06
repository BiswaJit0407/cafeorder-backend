const express = require("express")
const SpecialOffer = require("../models/SpecialOffer")
const auth = require("../middleware/auth")
const adminAuth = require("../middleware/adminAuth")

const router = express.Router()

// Get all active special offers (public)
router.get("/", async (req, res) => {
  try {
    const offers = await SpecialOffer.find({ active: true }).sort({ createdAt: -1 })
    res.json(offers)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Get all special offers including inactive (admin only)
router.get("/all", auth, adminAuth, async (req, res) => {
  try {
    const offers = await SpecialOffer.find().sort({ createdAt: -1 })
    res.json(offers)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Get special offer by ID
router.get("/:id", async (req, res) => {
  try {
    const offer = await SpecialOffer.findById(req.params.id)
    if (!offer) {
      return res.status(404).json({ message: "Special offer not found" })
    }
    res.json(offer)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Create special offer (admin only)
router.post("/", auth, adminAuth, async (req, res) => {
  try {
    const {
      name,
      description,
      offerType,
      items,
      originalPrice,
      offerPrice,
      image,
      validDays,
      bogoType,
      percentageOff,
      customRules,
      badgeText,
    } = req.body

    if (!name || !description || !offerType || !originalPrice || !offerPrice) {
      return res.status(400).json({ message: "Required fields are missing" })
    }

    if (items && items.length === 0) {
      return res.status(400).json({ message: "Offer must have at least one item" })
    }

    const offer = new SpecialOffer({
      name,
      description,
      offerType,
      items: items || [],
      originalPrice,
      offerPrice,
      image,
      validDays: validDays || [],
      bogoType,
      percentageOff,
      customRules,
      badgeText,
      active: true,
      allowCoupons: false,
    })

    await offer.save()

    // Create a corresponding menu item for the special offer
    const MenuItem = require("../models/MenuItem")
    const menuItem = new MenuItem({
      name: name,
      description: `${description} (Special Offer)`,
      price: offerPrice,
      category: "Special",
      image: image || "https://via.placeholder.com/300",
      available: true,
      isSpecialOffer: true,
      specialOfferId: offer._id,
    })

    await menuItem.save()

    // Store the menu item reference in the special offer
    offer.menuItemId = menuItem._id
    await offer.save()

    res.status(201).json({ message: "Special offer created successfully", offer })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Update special offer (admin only)
router.put("/:id", auth, adminAuth, async (req, res) => {
  try {
    const offer = await SpecialOffer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })

    if (!offer) {
      return res.status(404).json({ message: "Special offer not found" })
    }

    // Update the corresponding menu item if it exists
    if (offer.menuItemId) {
      const MenuItem = require("../models/MenuItem")
      await MenuItem.findByIdAndUpdate(offer.menuItemId, {
        name: offer.name,
        description: `${offer.description} (Special Offer)`,
        price: offer.offerPrice,
        image: offer.image,
        available: offer.active,
      })
    }

    res.json({ message: "Special offer updated successfully", offer })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Toggle special offer active status (admin only)
router.patch("/:id/toggle", auth, adminAuth, async (req, res) => {
  try {
    const offer = await SpecialOffer.findById(req.params.id)

    if (!offer) {
      return res.status(404).json({ message: "Special offer not found" })
    }

    offer.active = !offer.active
    await offer.save()

    // Update the corresponding menu item availability
    if (offer.menuItemId) {
      const MenuItem = require("../models/MenuItem")
      await MenuItem.findByIdAndUpdate(offer.menuItemId, {
        available: offer.active,
      })
    }

    res.json({ message: `Special offer ${offer.active ? "activated" : "deactivated"} successfully`, offer })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Delete special offer (admin only)
router.delete("/:id", auth, adminAuth, async (req, res) => {
  try {
    const offer = await SpecialOffer.findByIdAndDelete(req.params.id)

    if (!offer) {
      return res.status(404).json({ message: "Special offer not found" })
    }

    // Delete the corresponding menu item
    if (offer.menuItemId) {
      const MenuItem = require("../models/MenuItem")
      await MenuItem.findByIdAndDelete(offer.menuItemId)
    }

    res.json({ message: "Special offer deleted successfully" })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

module.exports = router
