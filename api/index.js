const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const serverless = require("serverless-http");

const app = express();

/* =========================
   MIDDLEWARE
========================= */
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

/* =========================
   DB CONNECTION (OPTIMIZED FOR VERCEL)
========================= */
let isConnected = false;

async function connectDB() {
  if (isConnected) return;

  await mongoose.connect(process.env.MONGO_URI);
  isConnected = true;

  console.log("✅ MongoDB Connected");
}

/* =========================
   MODELS
========================= */
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, trim: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  image: { type: String, default: "" },

  likedQuotes: [{ type: mongoose.Schema.Types.ObjectId }],

  ratedQuotes: [
    {
      quoteId: mongoose.Schema.Types.ObjectId,
      rating: Number
    }
  ],

  reviewedQuotes: [
    {
      quoteId: mongoose.Schema.Types.ObjectId,
      review: String
    }
  ]
}, { timestamps: true });

const quoteSchema = new mongoose.Schema({
  text: { type: String, required: true },
  likes: { type: Number, default: 0 }
});

const User = mongoose.model("User", userSchema);
const Quote = mongoose.model("Quote", quoteSchema);

/* =========================
   REGISTER
========================= */
app.post("/register", async (req, res) => {
  try {
    await connectDB();

    let { username, email } = req.body;

    if (!username || !email) {
      return res.status(400).json({ message: "Missing fields" });
    }

    email = email.trim().toLowerCase();

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const user = await User.create({ username, email });

    res.json({ message: "Registered", user });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =========================
   LOGIN
========================= */
app.post("/login", async (req, res) => {
  try {
    await connectDB();

    let { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email required" });
    }

    email = email.trim().toLowerCase();

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "Login success",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email
      }
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =========================
   QUOTES
========================= */
app.get("/quotes", async (req, res) => {
  try {
    await connectDB();

    let quotes = await Quote.find();

    if (!quotes.length) {
      quotes = await Quote.insertMany([
        { text: "Believe in yourself." },
        { text: "Work hard in silence." },
        { text: "Never give up." }
      ]);
    }

    res.json(quotes);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =========================
   LIKE
========================= */
app.post("/like/:userId/:quoteId", async (req, res) => {
  try {
    await connectDB();

    const { userId, quoteId } = req.params;

    const user = await User.findById(userId);
    const quote = await Quote.findById(quoteId);

    if (!user || !quote) {
      return res.status(404).json({ message: "Not found" });
    }

    const already = user.likedQuotes.some(id => id.toString() === quoteId);

    if (!already) {
      user.likedQuotes.push(quoteId);
      quote.likes++;
      await user.save();
      await quote.save();
    }

    res.json({ message: "Liked" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =========================
   STAR RATING
========================= */
app.post("/star/:userId/:quoteId", async (req, res) => {
  try {
    await connectDB();

    const { userId, quoteId } = req.params;
    const { star } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const existing = user.ratedQuotes.find(
      r => r.quoteId.toString() === quoteId
    );

    if (existing) {
      existing.rating = star;
    } else {
      user.ratedQuotes.push({ quoteId, rating: star });
    }

    await user.save();

    res.json({ message: "Rating saved" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =========================
   REVIEW
========================= */
app.post("/review/:userId/:quoteId", async (req, res) => {
  try {
    await connectDB();

    const { userId, quoteId } = req.params;
    const { review } = req.body;

    if (!review) {
      return res.status(400).json({ message: "Review required" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const existing = user.reviewedQuotes.find(
      r => r.quoteId.toString() === quoteId
    );

    if (existing) {
      return res.status(400).json({ message: "Already reviewed this quote" });
    }

    user.reviewedQuotes.push({ quoteId, review });

    await user.save();

    res.json({ message: "Review saved" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =========================
   GET USER
========================= */
app.get("/user/:id", async (req, res) => {
  try {
    await connectDB();

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =========================
   EXPORT (VERCEL SERVERLESS)
========================= */
module.exports = serverless(app);