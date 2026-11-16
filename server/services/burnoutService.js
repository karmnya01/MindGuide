const Groq = require("groq-sdk");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Analyzes behavioral data to produce a burnout assessment using Groq Llama-3.
 * @param {Object} userData - User activity and emotion data.
 */
async function analyzeBurnout(userData) {
  const prompt = `
You are a wellness analysis system. Analyze this user's behavioral data and produce a burnout assessment.

USER DATA (last 7 days):
- Sessions completed: ${userData.sessionCount}
- Average sessions per week (historical): ${userData.avgSessions}
- Dominant emotions: ${userData.topEmotions.join(", ")}
- Stress scores (1-10): ${userData.stressScores.join(", ")}
- Streak: ${userData.currentStreak} days (peak was ${userData.peakStreak})
- Goals completed: ${userData.goalsCompleted}
- Goals deferred: ${userData.goalsDeferred}

Output ONLY valid JSON:
{
  "burnoutScore": 0-100,
  "burnoutTrend": "stable|rising|critical",
  "energyLevel": "high|medium|low",
  "primarySignal": "One sentence: what is the strongest burnout indicator",
  "recoveryAdvice": "One sentence: gentle, non-clinical suggestion",
  "shouldTriggerCheckIn": true/false
}
`;

  try {
    const response = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      response_format: { type: "json_object" }
    });
    
    return JSON.parse(response.choices[0]?.message?.content);
  } catch (error) {
    console.error("Burnout Analysis Error:", error.message);
    return {
      burnoutScore: 20,
      burnoutTrend: "stable",
      energyLevel: "medium",
      primarySignal: "User activity is consistent with baseline.",
      recoveryAdvice: "Ensure you're taking short breaks during deep work sessions.",
      shouldTriggerCheckIn: false
    };
  }
}

module.exports = { analyzeBurnout };
