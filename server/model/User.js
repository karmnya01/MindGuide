const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const skillTypes = ["technical", "nontechnical"];
const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    clerkId: {
      type: String,
      unique: true,
      sparse: true,
    },
    password: {
      type: String,
      required: true,
    },
    pic: {
      type: String,
      default:
        "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg",
    },
    skills: [
      {
        skill: {
          type: String,
          required: true,
        },
        type: {
          type: String,
          enum: skillTypes,
          default: "technical", // Default to technical if not provided
        },
      },
    ],
    roadmap: {
      type: [
        {
          Goal: String,
          Description: String,
          timeline: String,
          recommendations: [
            {
              title: String,
              link: String,
            },
          ],
          isCompleted: Boolean,
        },
      ],
      default: [], // You may want to set a default value as an empty array
    },
    sessionHistory: [
      {
        date: { type: Date, default: Date.now },
        status: { type: String, default: "started" },
      },
    ],
    reportHistory: [
      {
        date: { type: Date, default: Date.now },
        status: { type: String, default: "started" },
        title: { type: String, default: "New Report" },
        filePath: { type: String, default: "" },
        pdfPath: { type: String, default: "" },
        csvPath: { type: String, default: "" },
      },
    ],
    // Gamification fields
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    lastActive: { type: Date, default: null },
    badges: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        earnedAt: { type: Date, default: Date.now },
      },
    ],
    // Subscription fields (Phase 1)
    subscriptionTier: {
      type: String,
      enum: ["free", "pro", "enterprise"],
      default: "free",
    },
    subscriptionExpiry: { type: Date, default: null },
    stripeCustomerId: { type: String, default: "" },
    stripeSubscriptionId: { type: String, default: "" },
    // F09: Reverse Streaks (Recovery)
    recoveryScore: { type: Number, default: 0 },
    recoveryEvents: [{ date: { type: Date, default: Date.now }, score: Number }],
    longestRecovery: { type: Number, default: 0 },
    // F07: Identity Statements
    identityStatements: [
      {
        text: { type: String, required: true },
        source: { type: String, enum: ["user", "ai"], default: "user" },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    // F02: Burnout Tracking
    burnoutScore: { type: Number, default: 0 },
    energyLevel: { type: String, enum: ["Low", "Medium", "High"], default: "High" },
  },

  {
    timestamps: true,
  }
);
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};
userSchema.methods.createJWT = function () {
  return jwt.sign(
    {
      email: this.email,
      _id: this._id,
      name: this.name,
      pic: this.pic,
      createdAt: this._id.getTimestamp(),
      skills: this.skills,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_LIFETIME,
    }
  );
};
const User = mongoose.model("User", userSchema);
module.exports = User;
