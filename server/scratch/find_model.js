require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function listModels() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // There isn't a direct listModels in the SDK easily accessible this way, 
    // but we can try to hit a known ones.
    const models = ["gemini-2.0-flash-exp", "gemini-1.5-flash-latest"];
    for (const m of models) {
      try {
        const model = genAI.getGenerativeModel({ model: m });
        const result = await model.generateContent("Hi");
        console.log(`Model ${m} works!`);
        break;
      } catch (e) {
        console.log(`Model ${m} failed: ${e.message}`);
      }
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

listModels();
