const mongoose = require("mongoose");

const selfStateSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // F03: Current Emotional State (The "Current Vibe")
    currentVibe: {
      emotion: { type: String, default: "Neutral" },
      intensity: { type: Number, min: 1, max: 10, default: 5 },
      lastUpdated: { type: Date, default: Date.now },
      drivingFactors: [String], // Why they feel this way
    },
    // F04: Behavioral Identity (How they interact)
    identityState: {
      communicationStyle: { type: String, default: "Seeker" }, // e.g., "Analytic", "Emotional", "Reserved"
      opennessScore: { type: Number, default: 50 },
      primaryGoal: { type: String },
    },
    history: [
      {
        date: { type: Date, default: Date.now },
        emotion: String,
        context: String,
      }
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("SelfState", selfStateSchema);
