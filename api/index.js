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
   DB CONNECT (Vercel Safe)
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
   MODELS
========================= */
const User = mongoose.models.User || mongoose.model("User", new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  image: { type: String, default: "" },
  likedQuotes: [{ type: mongoose.Schema.Types.ObjectId }],
  ratedQuotes: [{ quoteId: String, rating: Number }],
  reviewedQuotes: [{ quoteId: String, review: String }]
}, { timestamps: true }));

const Quote = mongoose.models.Quote || mongoose.model("Quote", new mongoose.Schema({
  text: String,
  likes: { type: Number, default: 0 }
}));

/* =========================
   REGISTER (FIXED)
========================= */
app.post("/register", async (req, res) => {
  try {
    await connectDB();

    const { username, email, image } = req.body;

    if (!username || !email) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const user = await User.create({
      username,
      email: email.toLowerCase(),
      image: image || ""
    });

    res.status(201).json({
      message: "Registered successfully",
      user
    });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   LOGIN
========================= */
app.post("/login", async (req, res) => {
  try {
    await connectDB();

    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ message: "Login success", user });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   QUOTES
========================= */
app.get("/quotes", async (req, res) => {
  await connectDB();

  let quotes = await Quote.find();

  if (quotes.length === 0) {
    quotes = await Quote.insertMany([
      { text: "Believe in yourself." },
      { text: "Work hard in silence." },
      { text: "Never give up." }
    ]);
  }

  res.json(quotes);
});

/* =========================
   USER
========================= */
app.get("/user/:id", async (req, res) => {
  try {
    await connectDB();

    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ message: "Not found" });

    res.json(user);

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   LIKE
========================= */
app.post("/like/:userId/:quoteId", async (req, res) => {
  await connectDB();

  const user = await User.findById(req.params.userId);
  const quote = await Quote.findById(req.params.quoteId);

  if (!user || !quote) return res.status(404).json({ message: "Not found" });

  if (!user.likedQuotes.includes(req.params.quoteId)) {
    user.likedQuotes.push(req.params.quoteId);
    quote.likes++;
    await user.save();
    await quote.save();
  }

  res.json({ message: "Liked" });
});

/* =========================
   STAR
========================= */
app.post("/star/:userId/:quoteId", async (req, res) => {
  await connectDB();

  const user = await User.findById(req.params.userId);

  const existing = user.ratedQuotes.find(r =>
    r.quoteId === req.params.quoteId
  );

  if (existing) {
    existing.rating = req.body.star;
  } else {
    user.ratedQuotes.push({
      quoteId: req.params.quoteId,
      rating: req.body.star
    });
  }

  await user.save();

  res.json({ message: "Rating saved" });
});

/* =========================
   REVIEW
========================= */
app.post("/review/:userId/:quoteId", async (req, res) => {
  await connectDB();

  const user = await User.findById(req.params.userId);

  user.reviewedQuotes.push({
    quoteId: req.params.quoteId,
    review: req.body.review
  });

  await user.save();

  res.json({ message: "Review saved" });
});

/* =========================
   EXPORT VERCEL
========================= */
module.exports = serverless(app);