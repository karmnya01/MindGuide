const mongoose = require("mongoose");

const messageSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      required: true,
      enum: ["user", "assistant", "system"],
    },
    content: {
      type: String,
      required: true,
    },
    counsellorType: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    emotion: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Message = mongoose.model("Message", messageSchema);

// Compound index for efficient per-user analytics queries
messageSchema.index({ userId: 1, createdAt: -1 });
messageSchema.index({ userId: 1, emotion: 1 });

module.exports = Message;
