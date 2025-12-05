const mongoose = require("mongoose")

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  userName: {
    type: String,
    required: true,
  },
  tableNumber: {
    type: Number,
    required: true,
  },
  items: [
    {
      menuItem: {
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
        min: 1,
      },
      price: {
        type: Number,
        required: true,
      },
    },
  ],
  totalAmount: {
    type: Number,
    required: true,
  },
  couponCode: {
    type: String,
    default: null,
  },
  discount: {
    type: Number,
    default: 0,
  },
  finalAmount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "preparing", "ready", "served", "paid", "cancelled"],
    default: "pending",
  },
  specialInstructions: {
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

// Update the updatedAt timestamp on save
orderSchema.pre("save", function (next) {
  this.updatedAt = Date.now()
  next()
})

module.exports = mongoose.model("Order", orderSchema)
