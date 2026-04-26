const mongoose = require("mongoose");

const quoteSchema = new mongoose.Schema({
  text: String,
  likes: { type: Number, default: 0 },
});

module.exports = mongoose.model("Quote", quoteSchema);