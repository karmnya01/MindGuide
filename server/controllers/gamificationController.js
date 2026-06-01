const asyncHandler = require("express-async-handler");
const {
  awardXP,
  updateStreak,
  checkAndAwardBadges,
  calculateLevel,
  nextLevelXP,
  BADGE_DEFINITIONS,
} = require("../services/gamificationService");
const User = require("../model/User");

/**
 * GET /api/v1/gamification/profile
 * Returns full gamification state for the authenticated user.
 */
const getGamificationProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select(
    "xp level streak badges lastActive name"
  );

  if (!user) {
    return res.status(404).json({ success: false, data: null, error: "User not found" });
  }

  const currentLevel = calculateLevel(user.xp);
  const currentLevelThreshold = Math.pow(currentLevel, 2) * 50;
  const nextThreshold = nextLevelXP(currentLevel);
  const xpIntoCurrentLevel = user.xp - currentLevelThreshold;
  const xpNeededForNextLevel = nextThreshold - currentLevelThreshold;

  // Enrich badges with metadata from definitions
  const enrichedBadges = BADGE_DEFINITIONS.map((def) => {
    const earned = user.badges.find((b) => b.id === def.id);
    return {
      id: def.id,
      name: def.name,
      description: def.description,
      earned: !!earned,
      earnedAt: earned?.earnedAt || null,
    };
  });

  return res.status(200).json({
    success: true,
    data: {
      xp: user.xp,
      level: currentLevel,
      streak: user.streak,
      lastActive: user.lastActive,
      xpProgress: {
        current: xpIntoCurrentLevel,
        needed: xpNeededForNextLevel,
        percentage: Math.min(
          100,
          Math.round((xpIntoCurrentLevel / xpNeededForNextLevel) * 100)
        ),
        nextLevelAt: nextThreshold,
      },
      badges: enrichedBadges,
    },
    error: null,
  });
});

module.exports = { getGamificationProfile };
