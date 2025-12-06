const mongoose = require("mongoose")

const specialOfferSchema = new mongoose.Schema(
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
    offerType: {
      type: String,
      enum: ["combo", "weekend", "bogo", "percentage", "custom"],
      required: true,
      default: "combo",
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
    offerPrice: {
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
    // Weekend offer specific fields
    validDays: {
      type: [String],
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      default: [],
    },
    // BOGO specific fields
    bogoType: {
      type: String,
      enum: ["buy1get1", "buy2get1", "buy1get1free"],
      default: null,
    },
    // Percentage discount
    percentageOff: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    // Custom offer details
    customRules: {
      type: String,
      default: "",
    },
    // Offer badge text
    badgeText: {
      type: String,
      default: "SPECIAL OFFER",
    },
    // Disable coupon usage
    allowCoupons: {
      type: Boolean,
      default: false,
    },
    // Reference to the created menu item
    menuItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MenuItem",
      default: null,
    },
  },
  {
    timestamps: true,
  }
)

// Calculate discount percentage before saving
specialOfferSchema.pre("save", function (next) {
  if (this.originalPrice && this.offerPrice) {
    this.discount = Math.round(((this.originalPrice - this.offerPrice) / this.originalPrice) * 100)
  }
  
  // Set badge text based on offer type if not custom
  if (!this.badgeText || this.badgeText === "SPECIAL OFFER") {
    switch (this.offerType) {
      case "combo":
        this.badgeText = "COMBO DEAL"
        break
      case "weekend":
        this.badgeText = "WEEKEND SPECIAL"
        break
      case "bogo":
        this.badgeText = this.bogoType === "buy1get1free" ? "BUY 1 GET 1 FREE" : "BOGO OFFER"
        break
      case "percentage":
        this.badgeText = `${this.percentageOff}% OFF`
        break
      default:
        this.badgeText = "SPECIAL OFFER"
    }
  }
  
  next()
})

module.exports = mongoose.model("SpecialOffer", specialOfferSchema)
