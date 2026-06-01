const mongoose = require("mongoose");

const studyRoomSchema = new mongoose.Schema(
  {
    roomName: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "A collaborative space for focused growth.",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: String,
      enum: ["DSA", "Web Dev", "Full Stack", "AI/ML", "Exams", "Design", "General"],
      default: "General",
    },
    visibility: {
      type: String,
      enum: ["public", "private", "invite-only"],
      default: "public",
    },
    maxParticipants: {
      type: Number,
      default: 10,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    roomXP: {
      type: Number,
      default: 0,
    },
    activeSession: {
      isLive: { type: Boolean, default: false },
      startTime: { type: Date },
      duration: { type: Number }, // in minutes
      goal: { type: String },
    },
    tags: [String],
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for member count
studyRoomSchema.virtual("memberCount").get(function () {
  return this.participants.length;
});

const StudyRoom = mongoose.model("StudyRoom", studyRoomSchema);

module.exports = StudyRoom;
