const mongoose = require("mongoose");

const tableSchema = new mongoose.Schema({
  tableNumber: {
    type: Number,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
  },
  currentUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },
  status: {
    type: String,
    enum: ["available", "occupied"],
    default: "available"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Table", tableSchema);
