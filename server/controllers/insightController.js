const asyncHandler = require("express-async-handler");
const Insight = require("../model/Insight");
const User = require("../model/User");
const { generateInsight, sendInsightEmail } = require("../services/insightService");

/**
 * GET /api/v1/insights/latest
 * Returns the most recent insight for the authenticated user.
 */
const getLatestInsight = asyncHandler(async (req, res) => {
  const insight = await Insight.findOne({ userId: req.user._id })
    .sort({ weekStart: -1 })
    .lean();

  return res.status(200).json({
    success: true,
    data: insight || null,
    error: null,
  });
});

/**
 * POST /api/v1/insights/trigger
 * Manual trigger for generating an insight immediately (development/testing only).
 */
const triggerInsight = asyncHandler(async (req, res) => {
  // Manual trigger enabled for user testing
  const user = req.user;
  let insight;

  try {
    insight = await generateInsight(user._id, user.name);
  } catch (err) {
    return res.status(500).json({
      success: false,
      data: null,
      error: `Insight generation failed: ${err.message}`,
    });
  }

  // Attempt email (non-blocking on failure)
  try {
    await sendInsightEmail(user.email, user.name, insight);
  } catch (emailErr) {
    console.warn("Insight email failed during manual trigger:", emailErr.message);
  }

  return res.status(200).json({
    success: true,
    data: insight,
    error: null,
  });
});

const { analyzeSessionCompletely } = require("../services/analysisService");
const Memory = require("../model/Memory");
const Reflection = require("../model/Reflection");
const SelfState = require("../model/SelfState");
const Journey = require("../model/Journey");
const Message = require("../model/Message");

/**
 * POST /api/v1/insights/debrief
 * Generates and saves a session debrief.
 */
const createSessionDebrief = asyncHandler(async (req, res) => {
  const { counsellorType } = req.body;

  // 1. Fetch recent messages for this counselor
  const messages = await Message.find({
    userId: req.user._id,
    counsellorType: counsellorType || "General",
  })
    .sort({ timestamp: -1 })
    .limit(20);

  if (messages.length < 5) {
    return res.status(400).json({
      success: false,
      error: "Not enough context to generate a debrief. Continue chatting!",
    });
  }

  // Reverse to chronological order for the AI
  const history = messages.reverse();

  // 2. Perform Consolidated Analysis (prevents 429 rate limit)
  let analysis;
  try {
    analysis = await analyzeSessionCompletely(req.user._id, history, req.user.name);
  } catch (err) {
    return res.status(500).json({ success: false, error: "AI analysis failed" });
  }

  const { debrief, memories, selfState, nextLevel } = analysis;

  // 3. Parallel Database Updates (Internal, non-blocking for response speed)
  const updates = [];

  // 3.1 Save Memories
  if (memories?.length > 0) {
    updates.push(Memory.insertMany(memories.map(m => ({ ...m, userId: req.user._id }))));
  }

  // 3.2 Update Self-State
  if (selfState) {
    updates.push((async () => {
      let state = await SelfState.findOne({ userId: req.user._id });
      if (!state) state = new SelfState({ userId: req.user._id });
      state.currentVibe = {
        emotion: selfState.emotion,
        intensity: selfState.intensity,
        lastUpdated: new Date(),
        drivingFactors: Array.isArray(selfState.factors) ? selfState.factors : []
      };
      state.identityState.communicationStyle = selfState.communicationStyle;
      state.identityState.opennessScore = Math.max(0, Math.min(100, state.identityState.opennessScore + (selfState.opennessChange || 0)));
      state.history.push({ 
        emotion: selfState.emotion, 
        context: Array.isArray(selfState.factors) ? selfState.factors.join(", ") : "" 
      });
      if (state.history.length > 50) state.history.shift();
      await state.save();
    })());
  }

  // 3.3 Extend Journey Path & Update User Wellness
  if (nextLevel || selfState) {
    updates.push((async () => {
      // Journey Update
      if (nextLevel) {
        let journey = await Journey.findOne({ userId: req.user._id });
        if (!journey) {
          journey = new Journey({ userId: req.user._id, tracks: [{ id: "main", title: "Personal Growth Path", levels: [] }] });
        }
        const track = journey.tracks[0];
        track.levels.push({
          id: Date.now(),
          title: nextLevel.title,
          description: nextLevel.description,
          order: track.levels.length,
          xpReward: 50,
          status: track.levels.length === 0 ? "unlocked" : "locked",
          resources: nextLevel.resources?.map(r => ({ title: r.title, link: r.url }))
        });
        await journey.save();
      }

      // User Wellness Sync
      if (selfState) {
        await User.findByIdAndUpdate(req.user._id, {
          $set: {
            burnoutScore: selfState.intensity * 10, // Simple mapping
            energyLevel: selfState.intensity > 7 ? "Low" : selfState.intensity > 4 ? "Medium" : "High"
          }
        });
      }
    })());
  }

  // 3.4 Save Reflection Log
  updates.push(Reflection.create({
    userId: req.user._id,
    content: debrief.summary,
    moodSnapshot: { emotion: selfState?.emotion, intensity: selfState?.intensity },
    keyTakeaway: debrief.keyInsights?.[0],
    growthArea: debrief.nextAction
  }));

  // 4. Wait for all critical updates
  try {
    await Promise.all(updates);
  } catch (e) {
    console.error("Post-session update failed:", e);
    // Continue anyway so user gets debrief, but log the error
  }

  // 5. Return Debrief to UI
  return res.status(200).json({
    success: true,
    data: debrief
  });
});

module.exports = { getLatestInsight, triggerInsight, createSessionDebrief };
