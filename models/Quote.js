const mongoose = require("mongoose");

const quoteSchema = new mongoose.Schema({
  text: String,
  likes: { type: Number, default: 0 },
  star: { type: Number, default: null },
  review: { type: String, default: null }
});

module.exports = mongoose.model("Quote", quoteSchema);