const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    userCode: {
      type: String,
      unique: true,
      required: true
    },

    username: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    image: {
      type: String,
      default: ""
    },

    likedQuotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Quote"
      }
    ],

    ratedQuotes: [
      {
        quoteId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Quote"
        },
        rating: {
          type: Number,
          min: 1,
          max: 5
        }
      }
    ],

    reviewedQuotes: [
      {
        quoteId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Quote"
        },
        review: String
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);