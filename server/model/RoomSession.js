const mongoose = require("mongoose");

const roomSessionSchema = new mongoose.Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudyRoom",
      required: true,
      index: true,
    },
    goal: {
      type: String,
      required: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    endedAt: {
      type: Date,
    },
    durationMinutes: {
      type: Number,
      required: true,
    },
    participants: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        joinedAt: { type: Date, default: Date.now },
        focusScore: { type: Number, default: 0 }, // Calculated at end
        xpEarned: { type: Number, default: 0 },
      },
    ],
    totalRoomXPGained: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["ongoing", "completed", "cancelled"],
      default: "ongoing",
    },
  },
  {
    timestamps: true,
  }
);

roomSessionSchema.index({ roomId: 1, startedAt: -1 });

const RoomSession = mongoose.model("RoomSession", roomSessionSchema);

module.exports = RoomSession;
