const Groq = require("groq-sdk");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const { Parser } = require("json2csv");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Perform a single, comprehensive analysis of a session to save API quota.
 */
async function analyzeSessionCompletely(userId, messages, userName = "User") {
  if (!messages || messages.length < 2) return null;

  const conversationText = messages
    .slice(-20)
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n");

  const prompt = `
    You are a professional growth mentor and data analyst. Analyze the following conversation between a user (${userName}) and their mentor.
    
    CONVERSATION:
    ${conversationText}
    
    Produce a comprehensive analysis in STRICT JSON format including SWOT analysis, specific recommendations, and an emotional intelligence assessment.
    
    JSON STRUCTURE:
    {
      "debrief": {
        "summary": "2-3 sentences of what was discussed",
        "emotionalArc": "How the energy shifted",
        "keyInsights": ["3 specific insights"],
        "swot": {
          "strengths": ["list"],
          "weaknesses": ["list"],
          "opportunities": ["list"],
          "threats": ["list"]
        },
        "nextAction": "One concrete step",
        "counselorQuote": "Warm closing quote"
      },
      "selfState": {
        "emotion": "Dominant emotion",
        "intensity": 1-10,
        "communicationStyle": "One-word style",
        "factors": ["list of 2-3 specific reasons for this emotion"]
      },
      "roadmap": [
        { "title": "Step 1", "description": "Goal", "resources": [{"title": "Source", "url": "url"}] }
      ]
    }
  `;

  try {
    const response = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      response_format: { type: "json_object" }
    });
    
    const content = response.choices[0]?.message?.content;
    return JSON.parse(content);
  } catch (err) {
    console.error("Master Analysis Failed:", err.message);
    throw err;
  }
}

/**
 * Generate a professional PDF report.
 */
async function generatePDFReport(reportData, userName, filePath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

    // Header
    doc.fontSize(25).text("Mind-Guide: Intelligence Report", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`User: ${userName}`, { align: "right" });
    doc.text(`Date: ${new Date().toLocaleDateString()}`, { align: "right" });
    doc.moveDown(2);

    // Summary
    doc.fontSize(16).text("1. Executive Summary", { underline: true });
    doc.fontSize(12).text(reportData.debrief?.summary || "No summary provided.");
    doc.moveDown();

    // Insights
    doc.fontSize(16).text("2. Key Insights", { underline: true });
    (reportData.debrief?.keyInsights || []).forEach((insight, i) => {
      doc.fontSize(12).text(`${i + 1}. ${insight}`);
    });
    doc.moveDown();

    // SWOT
    doc.fontSize(16).text("3. SWOT Analysis", { underline: true });
    const swot = reportData.debrief?.swot || {};
    doc.fontSize(12).text(`Strengths: ${(swot.strengths || []).join(", ")}`);
    doc.text(`Weaknesses: ${(swot.weaknesses || []).join(", ")}`);
    doc.text(`Opportunities: ${(swot.opportunities || []).join(", ")}`);
    doc.text(`Threats: ${(swot.threats || []).join(", ")}`);
    doc.moveDown();

    // State
    doc.fontSize(16).text("4. Emotional & Communication Profile", { underline: true });
    doc.fontSize(12).text(`Dominant Emotion: ${reportData.selfState?.emotion}`);
    doc.text(`Intensity: ${reportData.selfState?.intensity}/10`);
    doc.text(`Style: ${reportData.selfState?.communicationStyle}`);
    doc.moveDown();

    // Roadmap
    doc.fontSize(16).text("5. Strategic Roadmap", { underline: true });
    (reportData.roadmap || []).forEach((step, i) => {
      doc.fontSize(12).text(`${i + 1}. ${step.title}: ${step.description}`);
    });

    doc.end();

    stream.on("finish", () => resolve(filePath));
    stream.on("error", (err) => reject(err));
  });
}

/**
 * Generate a CSV report for data analysis.
 */
async function generateCSVReport(reportData, filePath) {
  try {
    const flatData = [
      {
        Summary: reportData.debrief?.summary,
        Emotion: reportData.selfState?.emotion,
        Intensity: reportData.selfState?.intensity,
        Top_Insight: reportData.debrief?.keyInsights?.[0] || "",
        Next_Step: reportData.debrief?.nextAction
      }
    ];

    const parser = new Parser();
    const csv = parser.parse(flatData);
    fs.writeFileSync(filePath, csv);
    return filePath;
  } catch (err) {
    console.error("CSV Generation Failed:", err);
    throw err;
  }
}

module.exports = { 
    analyzeSessionCompletely, 
    generatePDFReport, 
    generateCSVReport 
};
