const mongoose = require("mongoose");

const memorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["fact", "goal", "emotion_pattern", "milestone", "preference"],
      required: true,
    },
    content: { type: String, required: true },
    confidence: { type: Number, default: 1.0 },
    tags: [String],
    isActive: { type: Boolean, default: true },
    lastReinforcedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Memory = mongoose.model("Memory", memorySchema);
module.exports = Memory;
