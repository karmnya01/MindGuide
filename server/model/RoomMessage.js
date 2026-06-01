const mongoose = require("mongoose");

const roomMessageSchema = new mongoose.Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudyRoom",
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    messageType: {
      type: String,
      enum: ["text", "image", "resource", "system", "poll"],
      default: "text",
    },
    reactions: [
      {
        emoji: String,
        count: { type: Number, default: 1 },
        users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      },
    ],
    metadata: {
      resourceTitle: String,
      resourceLink: String,
      imageBuffer: String,
    },
  },
  {
    timestamps: true,
  }
);

// Optimize for fetching recent room messages
roomMessageSchema.index({ roomId: 1, createdAt: -1 });

const RoomMessage = mongoose.model("RoomMessage", roomMessageSchema);

module.exports = RoomMessage;
