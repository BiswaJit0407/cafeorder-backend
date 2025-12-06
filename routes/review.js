const express = require("express")
const Review = require("../models/Review")
const auth = require("../middleware/auth")
const adminAuth = require("../middleware/adminAuth")

const router = express.Router()

// Get all approved reviews (public)
router.get("/", async (req, res) => {
  try {
    const reviews = await Review.find({ approved: true })
      .sort({ createdAt: -1 })
      .limit(20)
    res.json(reviews)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Get user's own reviews (authenticated)
router.get("/my-reviews", auth, async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user.userId }).sort({ createdAt: -1 })
    res.json(reviews)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Get all reviews (admin only)
router.get("/all", auth, adminAuth, async (req, res) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 })
    res.json(reviews)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Create a review (authenticated users)
router.post("/", auth, async (req, res) => {
  try {
    const { rating, comment } = req.body

    if (!rating || !comment) {
      return res.status(400).json({ message: "Rating and comment are required" })
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" })
    }

    // Fetch user details to get the name
    const User = require("../models/User")
    const user = await User.findById(req.user.userId)
    
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    const review = new Review({
      user: req.user.userId,
      userName: user.name,
      rating,
      comment,
      approved: false, // Requires admin approval
    })

    await review.save()
    res.status(201).json({ message: "Review added successfully!", review })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Update review (user's own)
router.put("/:id", auth, async (req, res) => {
  try {
    const { rating, comment } = req.body
    const review = await Review.findById(req.params.id)

    if (!review) {
      return res.status(404).json({ message: "Review not found" })
    }

    if (review.user.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Not authorized to update this review" })
    }

    if (rating) review.rating = rating
    if (comment) review.comment = comment
    review.approved = false // Reset approval status after edit

    await review.save()
    res.json({ message: "Review updated successfully", review })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Delete review (user's own or admin)
router.delete("/:id", auth, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)

    if (!review) {
      return res.status(404).json({ message: "Review not found" })
    }

    if (review.user.toString() !== req.user.userId && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to delete this review" })
    }

    await Review.findByIdAndDelete(req.params.id)
    res.json({ message: "Review deleted successfully" })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Approve/Reject review (admin only)
router.put("/:id/approve", auth, adminAuth, async (req, res) => {
  try {
    const { approved } = req.body
    const review = await Review.findById(req.params.id)

    if (!review) {
      return res.status(404).json({ message: "Review not found" })
    }

    review.approved = approved
    await review.save()

    res.json({ message: `Review ${approved ? "approved" : "rejected"} successfully`, review })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

module.exports = router
