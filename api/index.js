const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const serverless = require("serverless-http");

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "10mb" }));

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!process.env.MONGO_URI) {
    console.error("❌ MONGO_URI is missing");
    throw new Error("MONGO_URI not set");
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGO_URI, {
      dbName: "journeyDB",
    });
  }

  try {
    cached.conn = await cached.promise;
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB ERROR:", err.message);
    throw err;
  }

  return cached.conn;
}

app.get("/", (req, res) => {
  res.json({ message: "API is running ✅" });
});

const User =
  mongoose.models.User ||
  mongoose.model(
    "User",
    new mongoose.Schema(
      {
        username: { type: String, required: true, trim: true },
        email: {
          type: String,
          required: true,
          unique: true,
          lowercase: true,
          trim: true,
        },
        image: { type: String, default: "" },
        likedQuotes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Quote" }],
        reviewedQuotes: [
          {
            quoteId: mongoose.Schema.Types.ObjectId,
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

    res.status(201).json({ message: "Registered", user });

  } catch (err) {
    console.error("REGISTER ERROR:", err.message);
    res.status(500).json({ message: err.message });
  }
});

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

    res.json({ message: "Login success", user });

  } catch (err) {
    console.error("LOGIN ERROR:", err.message);
    res.status(500).json({ message: err.message });
  }
});

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
    console.error("QUOTES ERROR:", err.message);
    res.status(500).json({ message: err.message });
  }
});

app.get("/user/:id", async (req, res) => {
  try {
    await connectDB();

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);

  } catch (err) {
    console.error("USER ERROR:", err.message);
    res.status(500).json({ message: err.message });
  }
});

app.post("/like/:userId/:quoteId", async (req, res) => {
  try {
    await connectDB();

    const { userId, quoteId } = req.params;

    const user = await User.findById(userId);
    const quote = await Quote.findById(quoteId);

    if (!user || !quote) {
      return res.status(404).json({ message: "Not found" });
    }

    if (!user.likedQuotes.includes(quoteId)) {
      user.likedQuotes.push(quoteId);
      quote.likes += 1;

      await user.save();
      await quote.save();
    }

    res.json({ message: "Liked" });

  } catch (err) {
    console.error("LIKE ERROR:", err.message);
    res.status(500).json({ message: err.message });
  }
});

app.post("/review/:userId/:quoteId", async (req, res) => {
  try {
    await connectDB();

    const { userId, quoteId } = req.params;
    const { review } = req.body;

    if (!review) {
      return res.status(400).json({ message: "Review required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.reviewedQuotes.push({ quoteId, review });
    await user.save();

    res.json({ message: "Review saved" });

  } catch (err) {
    console.error("REVIEW ERROR:", err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = serverless(app);