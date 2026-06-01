const jwt = require("jsonwebtoken");
const UserModel = require("../model/User");
const asyncHandler = require("express-async-handler");

const protect = asyncHandler(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await UserModel.findById(decoded._id).select("-password");
      next();
    } catch (error) {
      res.status(401);
      throw new Error("Not authorized, token failed");
    }
  }
  if (!token) {
    res.status(401);
    throw new Error("Not authorized, No token");
  }
});
const { getAuth, clerkClient } = require("@clerk/express");

const protectCookie = asyncHandler(async (req, res, next) => {
  // 1. Check for Clerk Auth (OAuth)
  const { userId } = getAuth(req);
  if (userId) {
    let user = await UserModel.findOne({ clerkId: userId });
    
    // Auto-sync Clerk user to MongoDB
    if (!user) {
      try {
        const clerkUser = await clerkClient.users.getUser(userId);
        user = await UserModel.create({
          clerkId: userId,
          name: `${clerkUser.firstName} ${clerkUser.lastName}`.trim() || clerkUser.username,
          email: clerkUser.emailAddresses[0].emailAddress,
          pic: clerkUser.imageUrl,
          password: "clerk_oauth_user", // Placeholder
        });
      } catch (err) {
        res.status(401);
        throw new Error("Failed to sync Clerk user: " + err.message);
      }
    }
    req.user = user;
    return next();
  }

  // 2. Fallback to existing JWT Cookie Auth
  const token = req.cookies?.token;
  if (!token) {
    res.status(401);
    throw new Error("Not Authenticated, No session found");
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await UserModel.findById(decoded._id).select("-password");
    if (!req.user) {
      res.status(401);
      throw new Error("Not Authenticated, User not found");
    }
    next();
  } catch (error) {
    const statusCode = res.statusCode === 200 ? 401 : res.statusCode;
    res.status(statusCode);
    throw new Error(error.message || "Not Authenticated, token failed");
  }
});

/**
 * Middleware to restrict access to specific subscription tiers.
 * Usage: router.get("/expert", protectCookie, requirePlan(["pro", "enterprise"]), getExpertInfo);
 */
const requirePlan = (tiers) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authorized. Please login." });
    }

    if (!tiers.includes(req.user.subscriptionTier)) {
      return res.status(403).json({
        error: `Action restricted. Your current plan (${req.user.subscriptionTier}) does not support this feature.`,
        requiredTiers: tiers,
        upgradeRequired: true
      });
    }
    next();
  };
};

module.exports = { protect, protectCookie, requirePlan };
