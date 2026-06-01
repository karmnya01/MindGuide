const User = require("../model/User");

/**
 * Non-linear XP level scaling using square-root curve.
 * Level thresholds: level N requires N^2 * 50 total XP
 *   Level 1 → 50 XP
 *   Level 2 → 200 XP
 *   Level 3 → 450 XP
 *   Level 4 → 800 XP
 */
function calculateLevel(xp) {
  return Math.floor(Math.sqrt(xp / 50));
}

function nextLevelXP(currentLevel) {
  return Math.pow(currentLevel + 1, 2) * 50;
}

/**
 * Award XP to a user atomically using $inc to prevent race conditions.
 * Recalculates level after update.
 */
async function awardXP(userId, xpAmount) {
  // Atomically increment XP
  const updated = await User.findByIdAndUpdate(
    userId,
    { $inc: { xp: xpAmount } },
    { new: true, select: "xp level badges lastActive" }
  );

  if (!updated) return null;

  const newLevel = calculateLevel(updated.xp);

  // Only write level if it changed (avoid unnecessary writes)
  if (newLevel !== updated.level) {
    updated.level = newLevel;
    await User.findByIdAndUpdate(userId, { $set: { level: newLevel } });
  }

  return {
    xp: updated.xp,
    level: newLevel,
    nextLevelXP: nextLevelXP(newLevel),
  };
}

/**
 * Update daily streak using UTC calendar-day comparison to avoid
 * timezone-related 24h boundary bugs.
 */
async function updateStreak(userId) {
  const user = await User.findById(userId).select("streak lastActive");
  if (!user) return null;

  const now = new Date();
  const todayUTC = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );

  let newStreak = user.streak;

  if (user.lastActive) {
    const lastDate = new Date(user.lastActive);
    const lastDayUTC = new Date(
      Date.UTC(
        lastDate.getUTCFullYear(),
        lastDate.getUTCMonth(),
        lastDate.getUTCDate()
      )
    );

    const diffDays = Math.round(
      (todayUTC - lastDayUTC) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) {
      // Already active today — do not increment streak again
      return { streak: user.streak };
    } else if (diffDays === 1) {
      // Consecutive day — extend streak
      newStreak = user.streak + 1;
    } else {
      // Gap > 1 day — F09: Recovery Mode
      // User lost a streak, but we track how quickly they return
      const recoveryPoint = diffDays <= 3 ? 10 : diffDays <= 7 ? 5 : 2;
      await User.findByIdAndUpdate(userId, {
        $inc: { recoveryScore: recoveryPoint },
        $push: { recoveryEvents: { date: now, score: recoveryPoint } },
      });
      newStreak = 1; // Basic streak still resets, but recovery score grows
    }
  } else {
    // First activity ever
    newStreak = 1;
  }

  await User.findByIdAndUpdate(userId, {
    $set: { streak: newStreak, lastActive: now },
  });

  return { streak: newStreak, recoveryMode: diffDays > 1 };
}

/**
 * Badge definitions and their unlock conditions.
 * Idempotent: checks existing badge IDs before inserting.
 */
const BADGE_DEFINITIONS = [
  {
    id: "first_login",
    name: "First Steps",
    description: "Completed your first session",
    check: (user) => (user.sessionHistory?.length || 0) >= 1,
  },
  {
    id: "streak_7",
    name: "7-Day Streak",
    description: "Maintained a 7-day activity streak",
    check: (user) => user.streak >= 7,
  },
  {
    id: "roadmap_complete",
    name: "Roadmap Champion",
    description: "Completed your entire learning roadmap",
    check: (user) =>
      user.roadmap?.length > 0 &&
      user.roadmap.every((item) => item.isCompleted === true),
  },
  {
    id: "xp_100",
    name: "Century Club",
    description: "Earned 100+ XP",
    check: (user) => user.xp >= 100,
  },
  {
    id: "xp_500",
    name: "Committed Learner",
    description: "Earned 500+ XP",
    check: (user) => user.xp >= 500,
  },
];

/**
 * Check all badge conditions and award any not yet earned.
 * Uses $addToSet-equivalent logic: only push badges the user doesn't already have.
 */
async function checkAndAwardBadges(userId) {
  const user = await User.findById(userId).select(
    "badges xp streak roadmap sessionHistory"
  );
  if (!user) return [];

  const existingIds = new Set(user.badges.map((b) => b.id));
  const newBadges = [];

  for (const def of BADGE_DEFINITIONS) {
    if (!existingIds.has(def.id) && def.check(user)) {
      newBadges.push({
        id: def.id,
        name: def.name,
        earnedAt: new Date(),
      });
    }
  }

  if (newBadges.length > 0) {
    await User.findByIdAndUpdate(userId, {
      $push: { badges: { $each: newBadges } },
    });
  }

  return newBadges;
}

module.exports = {
  awardXP,
  updateStreak,
  checkAndAwardBadges,
  calculateLevel,
  nextLevelXP,
  BADGE_DEFINITIONS,
};
