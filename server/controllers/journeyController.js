const asyncHandler = require("express-async-handler");
const Journey = require("../model/Journey");
const User = require("../model/User");
const {
  generateLevelsFromRoadmap,
  unlockNextLevel,
} = require("../services/journeyService");
const {
  awardXP,
  deductXP,
  checkAndAwardBadges,
} = require("../services/gamificationService");
const Groq = require("groq-sdk");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * GET /api/v1/journey
 * Returns the authenticated user's journey map.
 */
const getJourney = asyncHandler(async (req, res) => {
  const journey = await Journey.findOne({ userId: req.user._id }).lean();

  if (!journey) {
    return res.status(200).json({
      success: true,
      data: null,
      error: null,
    });
  }

  return res.status(200).json({ success: true, data: journey, error: null });
});

/**
 * POST /api/v1/journey/assessment
 * Body: { trackId: String, levelId: Number }
 * Generates a 3-question MCQ assessment based on level content.
 */
const generateAssessment = asyncHandler(async (req, res) => {
  const { trackId, levelId } = req.body;
  
  if (!trackId || levelId === undefined) {
    return res.status(400).json({ success: false, error: "trackId and levelId are required" });
  }

  const journey = await Journey.findOne({ userId: req.user._id });
  if (!journey) return res.status(404).json({ success: false, error: "Journey not found" });

  const track = journey.tracks.find(t => t.id === trackId);
  if (!track) return res.status(404).json({ success: false, error: "Track not found" });

  const level = track.levels.find(l => l.id === Number(levelId));
  if (!level) return res.status(404).json({ success: false, error: "Level not found" });

  const prompt = `Based on the following topic, generate a 3-question multiple choice quiz to test someone's understanding.
Topic: ${level.title}
Description: ${level.description}

Output strictly as a JSON object following this EXACT schema:
{
  "quiz": [
    {
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "correctIndex": number (0-3)
    }
  ]
}`;

  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      response_format: { type: "json_object" }
    });
    
    const parsed = JSON.parse(response.choices[0]?.message?.content || "{}");
    quizData = parsed.quiz || [];
  } catch (err) {
    console.error("Assessment Generation Error:", err.message);
    return res.status(500).json({ success: false, error: "Failed to generate quiz" });
  }

  res.status(200).json({ success: true, data: quizData });
});

/**
 * PATCH /api/v1/journey/progress
 * Body: { trackId: String, levelId: Number, passed: Boolean }
 * Marks a level as completed if passed, unlocking next. Deducts XP if failed.
 */
const updateProgress = asyncHandler(async (req, res) => {
  const { trackId, levelId, passed } = req.body;

  if (!trackId || levelId === undefined || passed === undefined) {
    return res.status(400).json({ success: false, data: null, error: "trackId, levelId, and passed are required" });
  }

  const journey = await Journey.findOne({ userId: req.user._id });
  if (!journey) return res.status(404).json({ success: false, data: null, error: "Journey not found" });

  const track = journey.tracks.find(t => t.id === trackId);
  if (!track) return res.status(404).json({ success: false, data: null, error: "Track not found" });

  const level = track.levels.find((l) => l.id === Number(levelId));
  if (!level) return res.status(404).json({ success: false, data: null, error: "Level not found" });

  if (level.status !== "unlocked") {
    return res.status(400).json({ success: false, data: null, error: "Only unlocked levels can be completed." });
  }

  if (passed === false) {
    // Deduct 10 XP (but don't let it go below 0 ideally, handled by deductXP service if it exists, or manually deduct if not)
    let xpResult = null;
    if (typeof deductXP === 'function') {
      xpResult = await deductXP(req.user._id, 10);
    } else {
       // Manual fallback if service not updated yet
       journey.totalXP = Math.max(0, journey.totalXP - 10);
       await journey.save();
    }
    return res.status(200).json({
      success: true,
      data: { passed: false, penalty: 10 },
      message: "Test failed. 10 XP deducted.",
    });
  }

  // Passed
  level.status = "completed";
  level.completedAt = new Date();

  unlockNextLevel(track);
  await journey.save();

  const [xpResult, newBadges] = await Promise.all([
    awardXP(req.user._id, level.xpReward),
    checkAndAwardBadges(req.user._id),
  ]);

  return res.status(200).json({
    success: true,
    data: { passed: true, journey, xpAwarded: level.xpReward, gamification: xpResult, newBadges },
    error: null,
  });
});

/**
 * POST /api/v1/journey/continue
 * Body: { trackId: String }
 * Generates and appends next steps for a fully completed track.
 */
const continueJourney = asyncHandler(async (req, res) => {
  const { trackId } = req.body;

  if (!trackId) {
    return res.status(400).json({ success: false, error: "trackId is required" });
  }

  const journey = await Journey.findOne({ userId: req.user._id });
  if (!journey) return res.status(404).json({ success: false, error: "Journey not found" });

  const track = journey.tracks.find(t => t.id === trackId);
  if (!track) return res.status(404).json({ success: false, error: "Track not found" });

  const lastLevel = track.levels.length > 0 ? track.levels[track.levels.length - 1] : { title: track.title, description: "Introduction to topic" };
  const prompt = `The user is on a learning path track titled "${track.title}". ${track.levels.length > 0 ? 'Their latest planned level is: "' + lastLevel.title + '" (' + lastLevel.description + ').' : ''}
Generate the NEXT 3 logical advanced steps to continue their learning journey.

Output strictly as a JSON object following this EXACT schema:
{
  "steps": [
    {
      "Goal": "string (the main task or step to take)",
      "Description": "string (details on how the user can fulfill this step)",
      "timeline": "string (estimated time)",
      "recommendations": [{"title": "string", "link": "string"}]
    }
  ]
}`;

  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      response_format: { type: "json_object" }
    });
    
    const parsed = JSON.parse(response.choices[0]?.message?.content || "{}");
    const newStepsData = parsed.steps || [];
    const newLevels = generateLevelsFromRoadmap(newStepsData);
  
  // Adjust order and IDs
  let nextOrder = track.levels.length;
  let nextId = Math.max(...track.levels.map(l => l.id)) + 1;
  
  newLevels.forEach((l, i) => {
      l.order = nextOrder + i;
      l.id = nextId + i;
      // First new level should be unlocked, the rest locked
      l.status = (i === 0) ? "unlocked" : "locked";
  });

    track.levels.push(...newLevels);
    await journey.save();

    res.status(200).json({ success: true, data: journey });
  } catch (err) {
    console.error("Continuation Generation Error:", err.message);
    return res.status(500).json({ success: false, error: "Failed to expand journey" });
  }
});

/**
 * POST /api/v1/journey
 * Body: { goal: String }
 * Manually initializes a new journey track.
 */
const createJourney = asyncHandler(async (req, res) => {
  const { goal } = req.body;
  if (!goal) return res.status(400).json({ success: false, error: "Goal is required" });

  const prompt = `Based on the goal "${goal}", generate a 5-step learning roadmap.
  Output strictly as a JSON object:
  {
    "steps": [
      {
        "Goal": "Step title",
        "Description": "Details",
        "timeline": "e.g. 1 week",
        "recommendations": [{"title": "Source", "url": "url"}]
      }
    ]
  }`;

  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      response_format: { type: "json_object" }
    });
    
    const parsed = JSON.parse(response.choices[0]?.message?.content || "{}");
    const steps = parsed.steps || [];
    const levels = generateLevelsFromRoadmap(steps);

    const newTrack = {
      id: "trk_" + Date.now().toString(),
      title: goal,
      levels: levels
    };

    const journey = await Journey.findOneAndUpdate(
      { userId: req.user._id },
      { 
        $push: { tracks: newTrack },
        $setOnInsert: { totalXP: 0 }
      },
      { upsert: true, new: true }
    );

    res.status(201).json({ success: true, data: journey });
  } catch (err) {
    console.error("Manual Journey Creation Error:", err.message);
    res.status(500).json({ success: false, error: "Failed to architect journey" });
  }
});

module.exports = { getJourney, createJourney, updateProgress, generateAssessment, continueJourney };
