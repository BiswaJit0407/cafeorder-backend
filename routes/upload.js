const express = require("express")
const cloudinary = require("../config/cloudinary")
const auth = require("../middleware/auth")
const adminAuth = require("../middleware/adminAuth")

const router = express.Router()

// Upload image to Cloudinary
router.post("/", auth, adminAuth, async (req, res) => {
  try {
    const { image } = req.body

    if (!image) {
      return res.status(400).json({ message: "No image data provided" })
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(image, {
      folder: "restaurant-menu",
      resource_type: "auto",
    })

    res.json({
      message: "Image uploaded successfully",
      url: result.secure_url,
      publicId: result.public_id,
    })
  } catch (error) {
    console.error("Upload error:", error)
    res.status(500).json({ message: "Failed to upload image", error: error.message })
  }
})

// Delete image from Cloudinary
router.delete("/:publicId", auth, adminAuth, async (req, res) => {
  try {
    const publicId = req.params.publicId.replace(/-/g, "/")

    await cloudinary.uploader.destroy(publicId)

    res.json({ message: "Image deleted successfully" })
  } catch (error) {
    console.error("Delete error:", error)
    res.status(500).json({ message: "Failed to delete image", error: error.message })
  }
})

module.exports = router
