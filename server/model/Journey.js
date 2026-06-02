const mongoose = require("mongoose");

const levelSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    order: { type: Number, required: true },
    xpReward: { type: Number, default: 50 },
    status: {
      type: String,
      enum: ["locked", "unlocked", "completed"],
      default: "locked",
    },
    completedAt: { type: Date, default: null },
    resources: [
      {
        title: { type: String },
        link: { type: String },
      },
    ],
    tasks: [
      {
        text: { type: String, required: true },
        done: { type: Boolean, default: false },
      },
    ],
  },
  { _id: false }
);

const trackSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    levels: [levelSchema],
  },
  { _id: false }
);

const journeySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    totalXP: { type: Number, default: 0 },
    tracks: [trackSchema],
  },
  { timestamps: true }
);

const Journey = mongoose.model("Journey", journeySchema);
module.exports = Journey;
