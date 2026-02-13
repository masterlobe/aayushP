require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "DELETE", "PUT", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

// 🔗 MongoDB connection (NO HARDCODED PASSWORDS)
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB error:", err));

// 📄 Schema (updated with rating + ratingsCount)
const callSchema = new mongoose.Schema(
  {
    clinic: { type: String, required: true },
    phone: String,
    learning: String,
    status: String,
    rating: { type: Number, default: 0 }, // your call quality rating
    ratingsCount: { type: Number, default: 0 }, // number of ratings clinic has
  },
  { timestamps: true }
);

const Call = mongoose.model("Call", callSchema);

// 🔹 Get all calls
app.get("/calls", async (req, res) => {
  try {
    const calls = await Call.find().sort({ createdAt: -1 });
    res.json(calls);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch calls" });
  }
});

// 🔹 Add a call (with validation & sanitization)
app.post("/calls", async (req, res) => {
  try {
    let {
      clinic,
      phone,
      learning,
      status,
      rating,
      ratingsCount,
    } = req.body;

    // 🔒 Basic validation
    if (!clinic || clinic.trim() === "") {
      return res.status(400).json({ error: "Clinic name is required" });
    }

    // 🧼 Sanitize inputs
    clinic = clinic.trim();
    learning = learning?.trim() || "";
    status = status || "Didn’t pick up";
    rating = Number(rating) || 0;
    ratingsCount = Number(ratingsCount) || 0;

    const newCall = new Call({
      clinic,
      phone,
      learning,
      status,
      rating,
      ratingsCount,
    });

    await newCall.save();
    res.status(201).json(newCall);
  } catch (err) {
    console.error("Add call error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 🔹 Delete a call
app.delete("/calls/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await Call.findByIdAndDelete(id);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete call" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});