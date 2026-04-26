const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const serverless = require("serverless-http");
require("dotenv").config();

const app = express();

/* =========================
   MIDDLEWARE
========================= */
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "10mb" }));

/* =========================
   DB CONNECT (Vercel SAFE FIXED)
========================= */
let cached = global.mongoose || { conn: null, promise: null };
global.mongoose = cached;

async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGO_URI).then((m) => m);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

/* =========================
   MODELS (SAFE INIT)
========================= */
const User =
  mongoose.models.User ||
  mongoose.model(
    "User",
    new mongoose.Schema(
      {
        username: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        image: { type: String, default: "" },

        likedQuotes: [{ type: String }],

        ratedQuotes: [
          {
            quoteId: String,
            rating: Number,
          },
        ],

        reviewedQuotes: [
          {
            quoteId: String,
            review: String,
          },
        ],
      },
      { timestamps: true }
    )
  );

const Quote =
  mongoose.models.Quote ||
  mongoose.model(
    "Quote",
    new mongoose.Schema(
      {
        text: { type: String, required: true },
        likes: { type: Number, default: 0 },
      },
      { timestamps: true }
    )
  );

/* =========================
   REGISTER (FIXED)
========================= */
app.post("/register", async (req, res) => {
  try {
    await connectDB();

    let { username, email, image } = req.body;

    if (!username || !email) {
      return res.status(400).json({ message: "Missing fields" });
    }

    email = email.toLowerCase().trim();

    const exists = await User.findOne({ email });

    if (exists) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const user = await User.create({
      username: username.trim(),
      email,
      image: image || "",
    });

    res.status(201).json({
      message: "Registered successfully",
      user,
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ message: "Server error" });
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

    email = email.toLowerCase().trim();

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "Login success",
      user,
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   QUOTES
========================= */
app.get("/quotes", async (req, res) => {
  try {
    await connectDB();

    let quotes = await Quote.find();

    if (quotes.length === 0) {
      quotes = await Quote.insertMany([
        { text: "Believe in yourself." },
        { text: "Work hard in silence." },
        { text: "Never give up." },
      ]);
    }

    res.json(quotes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
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
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   LIKE
========================= */
app.post("/like/:userId/:quoteId", async (req, res) => {
  try {
    await connectDB();

    const user = await User.findById(req.params.userId);
    const quote = await Quote.findById(req.params.quoteId);

    if (!user || !quote) {
      return res.status(404).json({ message: "Not found" });
    }

    if (!user.likedQuotes.includes(req.params.quoteId)) {
      user.likedQuotes.push(req.params.quoteId);
      quote.likes += 1;

      await user.save();
      await quote.save();
    }

    res.json({ message: "Liked" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   STAR RATING (FIXED SAFE COMPARE)
========================= */
app.post("/star/:userId/:quoteId", async (req, res) => {
  try {
    await connectDB();

    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const existing = user.ratedQuotes.find(
      (r) => r.quoteId === req.params.quoteId
    );

    if (existing) {
      existing.rating = req.body.star;
    } else {
      user.ratedQuotes.push({
        quoteId: req.params.quoteId,
        rating: req.body.star,
      });
    }

    await user.save();

    res.json({ message: "Rating saved" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   REVIEW
========================= */
app.post("/review/:userId/:quoteId", async (req, res) => {
  try {
    await connectDB();

    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.reviewedQuotes.push({
      quoteId: req.params.quoteId,
      review: req.body.review,
    });

    await user.save();

    res.json({ message: "Review saved" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   EXPORT VERCEL
========================= */
module.exports = serverless(app);