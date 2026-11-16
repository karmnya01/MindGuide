const Groq = require("groq-sdk");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Generates a session debrief using Groq Llama-3.
 */
async function generateDebrief(messages, emotionData) {
  const conversationText = messages
    .slice(-20)
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n");

  const prompt = `
You are a session debrief writer for a personal growth AI app.
Create a concise, warm, useful session summary.

CONVERSATION (last session):
${conversationText}

EMOTIONAL TREND DATA: ${JSON.stringify(emotionData)}

Output ONLY valid JSON:
{
  "summary": "2-3 sentences. What the user focused on and what was explored.",
  "emotionalArc": "One sentence. How the emotional energy shifted. E.g. 'Started uncertain, ended with clarity'",
  "keyInsights": ["insight 1", "insight 2", "insight 3"],
  "nextAction": "One specific, concrete action for the user to take in the next 24 hours.",
  "counselorQuote": "A 1-sentence reflection the counselor would say to close the session. Warm, direct, personal."
}
`;

  try {
    const response = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      response_format: { type: "json_object" }
    });
    
    return JSON.parse(response.choices[0]?.message?.content);
  } catch (error) {
    console.error("Debrief Generation Error:", error.message);
    return {
      summary: "We had a productive session exploring your goals. Keep up the momentum!",
      emotionalArc: "The session maintained a steady focused energy.",
      keyInsights: ["Valued self-reflection", "Explored core objectives"],
      nextAction: "Review today's notes when you have a moment.",
      counselorQuote: "Great work today. You're making real progress."
    };
  }
}

module.exports = { generateDebrief };
