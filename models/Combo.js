const mongoose = require("mongoose")

const comboSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    items: [
      {
        menuItemId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "MenuItem",
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          default: 1,
        },
      },
    ],
    originalPrice: {
      type: Number,
      required: true,
    },
    comboPrice: {
      type: Number,
      required: true,
    },
    discount: {
      type: Number,
      default: 0,
    },
    image: {
      type: String,
      default: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600",
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
)

// Calculate discount percentage before saving
comboSchema.pre("save", function (next) {
  if (this.originalPrice && this.comboPrice) {
    this.discount = Math.round(((this.originalPrice - this.comboPrice) / this.originalPrice) * 100)
  }
  next()
})

module.exports = mongoose.model("Combo", comboSchema)
