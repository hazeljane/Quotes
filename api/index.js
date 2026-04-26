const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const serverless = require("serverless-http");
require("dotenv").config();

const app = express();

/* =========================
   MIDDLEWARE
========================= */
app.use(cors({
  origin: "*",
  credentials: true
}));

app.use(express.json({ limit: "10mb" }));

/* =========================
   DB CONNECTION (VERCEL SAFE)
========================= */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }).then((mongoose) => {
      console.log("✅ MongoDB Connected");
      return mongoose;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

/* =========================
   MODELS
========================= */
const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, trim: true },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },

    image: { type: String, default: "" },

    likedQuotes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Quote" }],

    ratedQuotes: [
      {
        quoteId: { type: mongoose.Schema.Types.ObjectId, ref: "Quote" },
        rating: { type: Number, min: 1, max: 5 }
      }
    ],

    reviewedQuotes: [
      {
        quoteId: { type: mongoose.Schema.Types.ObjectId, ref: "Quote" },
        review: String
      }
    ]
  },
  { timestamps: true }
);

const quoteSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    likes: { type: Number, default: 0 }
  },
  { timestamps: true }
);

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

    email = email.toLowerCase().trim();

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const user = await User.create({ username, email });

    res.status(201).json({ message: "Registered", user });

  } catch (err) {
    console.error(err);
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
      user
    });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   GET QUOTES
========================= */
app.get("/quotes", async (req, res) => {
  try {
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

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   LIKE QUOTE
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

    const already = user.likedQuotes.includes(quoteId);

    if (!already) {
      user.likedQuotes.push(quoteId);
      quote.likes += 1;

      await user.save();
      await quote.save();
    }

    res.json({ message: "Liked" });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
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
    res.status(500).json({ message: "Server error" });
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

    const exists = user.reviewedQuotes.find(
      r => r.quoteId.toString() === quoteId
    );

    if (exists) {
      return res.status(400).json({ message: "Already reviewed" });
    }

    user.reviewedQuotes.push({ quoteId, review });

    await user.save();

    res.json({ message: "Review saved" });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   GET USER
========================= */
app.post("/register", async (req, res) => {
  try {
    await connectDB();

    let { username, email, image } = req.body;

    // VALIDATION
    if (!username || !email) {
      return res.status(400).json({
        message: "Username and email are required"
      });
    }

    email = email.toLowerCase().trim();

    // CHECK EXISTING USER
    const exists = await User.findOne({ email });

    if (exists) {
      return res.status(409).json({
        message: "Email already exists"
      });
    }

    // CREATE USER
    const user = await User.create({
      username: username.trim(),
      email,
      image: image || ""
    });

    // CLEAN RESPONSE (important for frontend)
    res.status(201).json({
      message: "Registered successfully",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        image: user.image
      }
    });

  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({
      message: "Server error during registration"
    });
  }
});

/* =========================
   EXPORT VERCEL
========================= */
module.exports = serverless(app);