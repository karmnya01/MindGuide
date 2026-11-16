const SelfState = require("../model/SelfState");
const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Updates the user's self-state based on a session's conversation using Groq.
 */
async function updateSelfState(userId, messages) {
  if (!messages || messages.length < 2) return;

  const conversationText = messages
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n");

  const prompt = `Analyze this conversation between a user and an AI mentor. 
  Determine the user's current "Vibe" and "Behavioral Identity".
  
  Format JSON ONLY:
  {
    "emotion": "Dominant emotion (e.g. Anxious, Confident, etc.)",
    "intensity": 1-10,
    "factors": ["Factor 1", "Factor 2"],
    "communicationStyle": "One word style (e.g. Direct, Vulnerable, Defensive)",
    "opennessChange": -5, 0, or 5
  }
  
  CONVERSATION:
  ${conversationText}`;

  try {
    const response = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      response_format: { type: "json_object" }
    });
    
    const data = JSON.parse(response.choices[0]?.message?.content);

    let state = await SelfState.findOne({ userId });
    if (!state) {
      state = new SelfState({ userId });
    }

    state.currentVibe = {
      emotion: data.emotion,
      intensity: data.intensity,
      lastUpdated: new Date(),
      drivingFactors: data.factors,
    };

    state.identityState.communicationStyle = data.communicationStyle;
    state.identityState.opennessScore = Math.max(0, Math.min(100, state.identityState.opennessScore + (data.opennessChange || 0)));

    state.history.push({
      emotion: data.emotion,
      context: data.factors.join(", "),
    });

    if (state.history.length > 50) state.history.shift();

    await state.save();
    return state;
  } catch (err) {
    console.error("Failed to update SelfState:", err.message);
  }
}

module.exports = { updateSelfState };
