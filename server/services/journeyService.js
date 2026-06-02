const Journey = require("../model/Journey");
const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Dynamically appends a new learning level to the user's journey based on recent session history using Groq.
 */
async function generateNextLevel(userId, sessionHistory) {
  if (!sessionHistory || sessionHistory.length < 2) return;

  const conversationText = sessionHistory.map(m => `${m.role}: ${m.content}`).join("\n");

  const prompt = `Analyze this mentoring session and generate ONE new learning level for the user's roadmap. 
  The level should be a logical next step based on what they discussed.
  
  Format JSON ONLY:
  {
    "title": "Short Level Title",
    "description": "What they will learn",
    "tasks": ["Task 1", "Task 2"],
    "resources": [{"title": "Source", "url": "https://..."}]
  }
  
  CONVERSATION:
  ${conversationText}`;

  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      response_format: { type: "json_object" }
    });
    
    const levelData = JSON.parse(response.choices[0]?.message?.content);

    let journey = await Journey.findOne({ userId });
    if (!journey) {
      journey = new Journey({ 
        userId, 
        tracks: [{ id: "main", title: "Personal Growth Path", levels: [] }] 
      });
    }

    if (journey.tracks.length === 0) {
      journey.tracks.push({ id: "main", title: "Personal Growth Path", levels: [] });
    }

    const mainTrack = journey.tracks[0];
    const newOrder = mainTrack.levels.length;

    mainTrack.levels.push({
      id: Date.now(),
      title: levelData.title,
      description: levelData.description,
      tasks: levelData.tasks,
      resources: levelData.resources?.map(r => ({ title: r.title, link: r.url })),
      order: newOrder,
      xpReward: 50,
      status: newOrder === 0 ? "unlocked" : "locked",
    });

    await journey.save();
    return journey;
  } catch (err) {
    console.error("Failed to generate next journey level:", err.message);
  }
}

/**
 * Converts a raw roadmap (array of steps) into structured journey levels.
 */
function generateLevelsFromRoadmap(roadmapData) {
  if (!Array.isArray(roadmapData)) return [];
  
  const normalizeTasks = (step) => {
    const raw = step.tasks || step.todos || [];
    if (!Array.isArray(raw)) return [];
    return raw.map((t) => {
      if (typeof t === "string") return { text: t, done: false };
      return { text: t.text || t.title || String(t), done: Boolean(t.done) };
    }).filter((t) => t.text);
  };

  return roadmapData.map((step, index) => ({
    id: Date.now() + index,
    title: step.Goal || step.title || "Step",
    description: step.Description || step.description || "",
    tasks: normalizeTasks(step),
    resources:
      step.recommendations?.map((r) => ({
        title: r.title,
        link: r.link || r.url,
      })) ||
      step.resources?.map((r) => ({ title: r.title, link: r.url || r.link })) ||
      [],
    order: index,
    xpReward: 50,
    status: index === 0 ? "unlocked" : "locked",
  }));
}

/**
 * Unlocks the next level in a track after completion.
 */
function unlockNextLevel(track) {
  if (!track || !track.levels) return;
  
  const lastCompletedIndex = track.levels.reduce((last, lvl, idx) => {
    return lvl.status === "completed" ? idx : last;
  }, -1);

  if (lastCompletedIndex !== -1 && lastCompletedIndex < track.levels.length - 1) {
    const nextLvl = track.levels[lastCompletedIndex + 1];
    if (nextLvl.status === "locked") {
      nextLvl.status = "unlocked";
    }
  }
}

module.exports = { generateNextLevel, generateLevelsFromRoadmap, unlockNextLevel };
