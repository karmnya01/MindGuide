const mongoose = require("mongoose");

const reflectionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    date: { type: Date, default: Date.now },
    content: { type: String, required: true }, // The AI-generated reflection summary
    moodSnapshot: {
      emotion: String,
      intensity: Number,
    },
    keyTakeaway: { type: String },
    growthArea: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Reflection", reflectionSchema);
