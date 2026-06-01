const mongoose = require("mongoose");

const contractSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    goalId: { type: String, required: true }, // Links to Roadmap item or specific goal
    title: { type: String, required: true },
    description: { type: String },
    deadline: { type: Date, required: true },
    status: {
      type: String,
      enum: ["active", "completed", "failed", "deferred"],
      default: "active",
    },
    commitmentLevel: {
      type: String,
      enum: ["casual", "firm", "unbreakable"],
      default: "firm",
    },
    checkInFrequency: {
      type: String,
      enum: ["daily", "weekly"],
      default: "daily",
    },
    checkIns: [
      {
        date: { type: Date, default: Date.now },
        status: { type: String, enum: ["missed", "completed", "skipped"] },
        note: String,
      },
    ],
    lastCheckIn: Date,
    penaltyXP: { type: Number, default: 100 }, // XP lost if failed
    rewardXP: { type: Number, default: 250 }, // XP earned if completed
  },
  { timestamps: true }
);

const Contract = mongoose.model("Contract", contractSchema);
module.exports = Contract;
