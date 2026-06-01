const mongoose = require("mongoose");

const insightSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    weekStart: { type: Date, required: true },
    summary: { type: String, default: "" },
    strengths: { type: [String], default: [] },
    weaknesses: { type: [String], default: [] },
    suggestions: { type: [String], default: [] },
    emotionBreakdown: { type: Map, of: Number, default: {} },
    messagesAnalyzed: { type: Number, default: 0 },
    levelsCompleted: { type: Number, default: 0 },
    generatedAt: { type: Date, default: Date.now },
    // F05: Session Debriefs
    sessionDebriefs: [
      {
        sessionDate: { type: Date, default: Date.now },
        summary: String,
        emotionalArc: String, // "started anxious → ended motivated"
        keyInsights: [String], // 3 bullet points
        nextAction: String,
        counselorQuote: String,
        xpEarned: { type: Number, default: 0 },
        shareToken: { type: String, default: null }, // UUID, null by default
        shareExpiry: Date,
      },
    ],
    // F02: Burnout Score
    burnoutScore: { type: Number, min: 0, max: 100, default: null },
    burnoutTrend: {
      type: String,
      enum: ["stable", "rising", "critical"],
      default: "stable",
    },
    energyLevel: {
      type: String,
      enum: ["high", "medium", "low"],
      default: "medium",
    },
  },
  { timestamps: true }
);

// Index for fetching latest insight per user efficiently
insightSchema.index({ userId: 1, weekStart: -1 });

const Insight = mongoose.model("Insight", insightSchema);
module.exports = Insight;
