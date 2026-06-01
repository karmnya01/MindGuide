require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testGeminiFixed() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    // Test the new format
    const systemInstruction = { parts: [{ text: "You are a helpful assistant." }] };
    
    const chat = model.startChat({
      systemInstruction: systemInstruction,
      history: [],
    });

    const result = await chat.sendMessage("Hello!");
    console.log("Response:", result.response.text());
  } catch (error) {
    console.error("Gemini Error:", error);
  }
}

testGeminiFixed();
