const Groq = require("groq-sdk");
const Memory = require("../model/Memory");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Extracts structured memories from a conversation using Groq Llama-3.
 */
async function extractMemories(userId, messages) {
  const conversationText = messages
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n");

  const prompt = `
You are a memory extraction system for a personal growth AI app.
Analyze this conversation and extract structured memories about the user.

CONVERSATION:
${conversationText}

Extract up to 6 memories. Output ONLY valid JSON, no other text, no markdown.

Schema:
{
  "memories": [
    {
      "type": "fact|goal|emotion_pattern|milestone|preference",
      "content": "Single sentence. Present tense. About the user, not the conversation.",
      "confidence": 0.0-1.0,
      "tags": ["tag1", "tag2"]
    }
  ]
}
`;

  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      response_format: { type: "json_object" }
    });
    
    const data = JSON.parse(response.choices[0]?.message?.content);
    
    if (data.memories && data.memories.length > 0) {
      await Memory.insertMany(data.memories.map(m => ({ ...m, userId })));
    }
    
    return data.memories;
  } catch (error) {
    console.error("Memory Extraction Error:", error.message);
    return [];
  }
}

async function injectMemories(userId) {
  const memories = await Memory.find({ userId, isActive: true })
    .sort({ confidence: -1, lastReinforcedAt: -1 })
    .limit(10);
  
  if (memories.length === 0) return "";
  
  return `\nRELEVANT USER CONTEXT (Memories):\n${memories.map(m => `- ${m.content}`).join("\n")}\n`;
}

module.exports = {
  extractMemories,
  injectMemories,
};
