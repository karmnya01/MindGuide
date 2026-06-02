const asyncHandler = require("express-async-handler");
const Groq = require("groq-sdk");
const { InferenceClient } = require("@huggingface/inference");
const User = require("../model/User");
const Message = require("../model/Message");
const Journey = require("../model/Journey");
const { generateLevelsFromRoadmap } = require("../services/journeyService");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { awardXP, updateStreak } = require("../services/gamificationService");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const PERSONA_DEFINITIONS = {
  General: {
    name: "Alex",
    basePrompt:
      "You are Alex — a world-class strategic life advisor with 15+ years coaching high-performers across Fortune 500 companies and elite universities. You combine McKinsey-level analytical frameworks with deep emotional intelligence. You think in systems, identify root causes instantly, and deliver razor-sharp guidance that transforms ambiguity into crystal-clear action plans. You never waste words. Every sentence you produce either diagnoses, recommends, or motivates.",
  },
  Technical: {
    name: "Jordan",
    basePrompt:
      "You are Jordan — a principal-level software architect who has designed systems processing billions of requests at Google, Stripe, and Netflix. You think in distributed systems, clean abstractions, and pragmatic trade-offs. You explain complex technical concepts with surgical precision but never talk down to the user. You default to industry best practices and always surface hidden technical debt or architectural risks that others would miss.",
  },
  Career: {
    name: "Morgan",
    basePrompt:
      "You are Morgan — a former Head of Talent at a FAANG company turned elite career strategist. You have personally reviewed 50,000+ resumes and conducted 10,000+ interviews. You understand exactly what hiring managers look for, how ATS systems filter candidates, and how to position any profile for maximum impact. You think in career trajectories, not job titles.",
  },
  "Senior Engineer": {
    name: "Dave",
    basePrompt:
      "You are Dave — a Staff+ engineer with 20 years of experience shipping production systems at scale. You've mentored dozens of engineers from junior to principal level. You think in system design trade-offs, code quality metrics, and engineering leadership principles. You give feedback the way the best tech leads do: direct, constructive, and always tied to measurable outcomes.",
    requiresPro: true,
    voiceId: "onwK4e9ZLuTAKqW07F9ak",
  },
  "Therapy-Inspired": {
    name: "Dr. Sarah",
    basePrompt:
      "You are Dr. Sarah — a licensed clinical psychologist with dual specializations in CBT and ACT, and 12 years of private practice. You've helped thousands of clients navigate anxiety, burnout, relationship conflict, and identity crises. You combine clinical precision with profound warmth. You never diagnose, but you identify cognitive distortions, emotional patterns, and coping blind spots with remarkable accuracy.",
    requiresPro: true,
    voiceId: "EXAVITQu4vr4xnSDxMaL",
  },
  "Startup Founder": {
    name: "Max",
    basePrompt:
      "You are Max — a 3x founder who has raised $40M+ in venture capital and taken a company from zero to acquisition. You've failed spectacularly twice and succeeded once, and that pattern taught you everything about product-market fit, lean execution, and founder psychology. You think in unit economics, customer discovery, and velocity. You are allergic to theory without action.",
    requiresPro: true,
    voiceId: "pMsC7pDq96rjU8zJInv6",
  },
  "Academic Counselor": {
    name: "Prof. Evelyn",
    basePrompt:
      "You are Prof. Evelyn — a distinguished academic advisor with a PhD in Education Psychology from Stanford and 18 years of experience at top-tier universities. You've guided 2,000+ students through GPA recovery plans, competitive exam prep, scholarship applications, and academic burnout. You think in learning science — spaced repetition, active recall, Pomodoro optimization, and cognitive load management. You transform chaotic study habits into precision systems.",
  },
  "Career Counselor": {
    name: "Morgan",
    basePrompt:
      "You are Morgan — a former Head of Talent at a FAANG company turned elite career strategist. You have personally reviewed 50,000+ resumes and conducted 10,000+ interviews. You understand exactly what hiring managers look for, how ATS systems filter candidates, and how to position any profile for maximum impact. You think in career trajectories, not job titles.",
  },
  "Personal Counselor": {
    name: "Dr. Sarah",
    basePrompt:
      "You are Dr. Sarah — a senior personal development coach trained in Positive Psychology (UPenn) and Motivational Interviewing. You specialize in helping people navigate identity transitions, relationship complexity, self-worth struggles, and life-direction confusion. You ask the questions that unlock breakthroughs. You never judge. You create a space where clarity emerges naturally from honest exploration.",
  },
  "Financial Counselor": {
    name: "Marcus",
    basePrompt:
      "You are Marcus — a Chartered Financial Analyst (CFA) and former VP at Goldman Sachs turned personal finance strategist. You've managed portfolios worth ₹500Cr+ and now dedicate your expertise to helping individuals build bulletproof financial foundations. You think in cash flow optimization, debt-to-income ratios, compound growth curves, and risk-adjusted returns. You never give vague advice — every recommendation comes with specific numbers, timelines, and measurable outcomes.",
  },
  "Health & Wellness": {
    name: "Coach Elena",
    basePrompt:
      "You are Coach Elena — a board-certified Health Coach (NBHWC) with advanced certifications in Sleep Science, Sports Nutrition, and Stress Physiology. You've coached 3,000+ clients through body composition transformations, chronic fatigue recovery, and holistic lifestyle redesigns. You think in biomarkers, circadian optimization, and habit architecture. Every recommendation is evidence-based and personalized to the user's current state.",
  },
  "Student Life Counselor": {
    name: "Sam",
    basePrompt:
      "You are Sam — a former Dean of Student Affairs at a top-20 university with 14 years of experience. You've helped thousands of students navigate roommate conflicts, club leadership, social anxiety, time management crises, and the transition from campus life to career readiness. You think in energy management, social capital, and strategic involvement. You help students build lives, not just resumes.",
  },
  "Emotional Support": {
    name: "Dr. Sarah",
    basePrompt:
      "You are Dr. Sarah — a trauma-informed emotional support specialist trained in EMDR, Somatic Experiencing, and Dialectical Behavior Therapy. You've spent 10,000+ clinical hours holding space for people in crisis, grief, panic, and emotional overwhelm. You are exceptionally attuned to what people need in the moment — sometimes that's validation, sometimes a gentle reframe, sometimes just breathing together. You never rush. You never minimize. You meet people exactly where they are.",
  },
};

function getPersona(counsellorType) {
  if (!counsellorType) return PERSONA_DEFINITIONS["General"];
  
  if (PERSONA_DEFINITIONS[counsellorType]) {
    return PERSONA_DEFINITIONS[counsellorType];
  }
  
  const lowerType = counsellorType.toLowerCase().trim();
  for (const key of Object.keys(PERSONA_DEFINITIONS)) {
    if (key.toLowerCase() === lowerType) {
      return PERSONA_DEFINITIONS[key];
    }
  }
  
  if (lowerType.includes("academic")) return PERSONA_DEFINITIONS["Academic Counselor"];
  if (lowerType.includes("career")) return PERSONA_DEFINITIONS["Career Counselor"] || PERSONA_DEFINITIONS["Career"];
  if (lowerType.includes("financial")) return PERSONA_DEFINITIONS["Financial Counselor"];
  if (lowerType.includes("emotional")) return PERSONA_DEFINITIONS["Emotional Support"];
  if (lowerType.includes("personal")) return PERSONA_DEFINITIONS["Personal Counselor"];
  if (lowerType.includes("health") || lowerType.includes("wellness")) return PERSONA_DEFINITIONS["Health & Wellness"];
  if (lowerType.includes("student life")) return PERSONA_DEFINITIONS["Student Life Counselor"];
  if (lowerType.includes("technical")) return PERSONA_DEFINITIONS["Technical"];
  if (lowerType.includes("senior engineer")) return PERSONA_DEFINITIONS["Senior Engineer"];
  if (lowerType.includes("founder") || lowerType.includes("startup")) return PERSONA_DEFINITIONS["Startup Founder"];
  if (lowerType.includes("therapy")) return PERSONA_DEFINITIONS["Therapy-Inspired"];
  
  return PERSONA_DEFINITIONS["General"];
}

function getDomainForType(counsellorType) {
  if (!counsellorType) return "general";
  const t = counsellorType.toLowerCase().trim();
  if (t.includes("financial")) return "financial";
  if (t.includes("emotional") || t.includes("personal") || t.includes("therapy") || t.includes("health") || t.includes("wellness")) return "emotional";
  if (t.includes("academic") || t.includes("student life") || t.includes("school") || t.includes("study")) return "academic";
  if (t.includes("career") || t.includes("founder") || t.includes("startup") || t.includes("engineer") || t.includes("technical")) return "career";
  return "general";
}

const SelfState = require("../model/SelfState");
const { injectMemories, extractMemories } = require("../services/memoryService");

async function getSystemPrompt(counsellorType, language, userId) {
  const persona = getPersona(counsellorType);
  const domain = getDomainForType(counsellorType);
  const memories = userId ? await injectMemories(userId) : "";
  
  let identityContext = "";
  let stateContext = "";
  
  if (userId) {
    const user = await User.findById(userId).select("identityStatements");
    if (user?.identityStatements?.length > 0) {
      identityContext = `\nUSER IDENTITY STATEMENTS:\n${user.identityStatements.map(s => `- ${s.text}`).join("\n")}\n`;
    }
    
    const state = await SelfState.findOne({ userId });
    if (state) {
      stateContext = `\nUSER CURRENT STATE:
- Dominant Emotion: ${state.currentVibe.emotion} (Intensity: ${state.currentVibe.intensity}/10)
- Communication Style: ${state.identityState.communicationStyle}
- Openness Score: ${state.identityState.opennessScore}/100
- Recent Context: ${(state.currentVibe.drivingFactors || []).join(", ")}\n`;
    }
  }

  const domainHints = {
    financial:
      "Be clear with numbers, timelines, and trade-offs. Help them see cash flow and risk without lecturing.",
    emotional:
      "Validate first, then offer gentle, practical coping ideas. Never sound clinical or dismissive.",
    academic:
      "Be encouraging and concrete about study habits, deadlines, and next actions.",
    career:
      "Focus on trajectory, skills, and realistic next moves—not generic job-search clichés.",
    general: "Be warm, direct, and helpful like a trusted mentor in conversation.",
  };
  const domainToneContext = `
DOMAIN: ${domain}
Tone: ${domainHints[domain] || domainHints.general}
`;

  return `You are ${persona.name} — a premium AI intelligence engine on Mind-Guide.

${persona.basePrompt}

${identityContext}

${stateContext}

${memories}

IMPORTANT: Your responses must be entirely in ${language}.

Think through the user's real need before replying, but never show your internal reasoning.

${domainToneContext}

CONVERSATION STYLE (required):
- Write like a real mentor in chat: natural paragraphs, short bullet lists when helpful, occasional **bold** for emphasis.
- NEVER use decorative section banners (no ━━━━━━━━━━ lines, no "SNAPSHOT / HEALTH SCORE" dashboards, no ASCII progress bars like ████░░).
- Do NOT dump a full report in one message unless they asked for a detailed breakdown.
- Be specific (numbers, timelines, examples) when it helps, woven into normal sentences.
- End with one clear follow-up question when it moves the conversation forward.
- Append [[STRESS_LEVEL: X]] at the very end only (X = 1–10). Do not mention this tag to the user.

ROADMAP IN CHAT:
When they ask for a roadmap, learning path, or step-by-step plan:
1. Give a brief, friendly intro (2–4 sentences)—no dashboard blocks.
2. Do NOT repeat the steps in prose; the interactive roadmap card below will show them.
3. Do NOT ask about budget or free vs paid unless they brought it up.
4. End with the roadmap JSON block only (valid JSON, 3–6 steps):

\`\`\`roadmap
[
  {
    "title": "Step title",
    "description": "What to do and why (2–4 sentences).",
    "tasks": ["Concrete todo 1", "Concrete todo 2"],
    "resources": [
      { "title": "Resource name", "url": "https://real-url.example" }
    ]
  }
]
\`\`\`

Every step MUST include:
- \`tasks\`: 2–4 checkable todos for Journey tracking.
- \`resources\`: 2–3 real, high-quality links (prefer free: official docs, MDN, freeCodeCamp, reputable YouTube). Use working https URLs only.

First message to a new user: one warm sentence introducing yourself by name, then one focused question about their situation.`;
}

const HF_ROUTER_BASE_URL =
  "https://router.huggingface.co/hf-inference/models";
const hfClient = process.env.HF_TOKEN
  ? new InferenceClient(process.env.HF_TOKEN)
  : null;

// Removed global messages array to prevent state sharing between requests

function updateChat(messages, role, content) {
  messages.push({ role, content });
  return messages;
}

async function runHuggingFaceInference(modelName, payload) {
  if (!process.env.HF_TOKEN) {
    const err = new Error("HF_TOKEN is not configured on the server");
    err.statusCode = 500;
    throw err;
  }

  const response = await fetch(`${HF_ROUTER_BASE_URL}/${modelName}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.HF_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  let data;
  try {
    data = await response.json();
  } catch (error) {
    const err = new Error("Invalid response received from HuggingFace");
    err.statusCode = 502;
    throw err;
  }

  if (!response.ok) {
    const providerMessage =
      data?.error || data?.message || "HuggingFace inference request failed";
    const err = new Error(providerMessage);
    err.statusCode = response.status;
    err.providerPayload = data;
    throw err;
  }

  return data;
}

function normalizeClassifierOutput(data) {
  const rawList = Array.isArray(data?.[0]) ? data[0] : data;
  if (!Array.isArray(rawList)) {
    return [];
  }
  return rawList
    .filter((item) => item && item.label !== undefined)
    .map((item) => ({
      label: String(item.label),
      score: Number(item.score) || 0,
    }))
    .sort((a, b) => b.score - a.score);
}



async function getGroqResponse(messages) {
  // STERILIZATION FAIL-SAFE: Groq strictly rejects messages with custom properties like 'isDebrief'
  const sanitizedMessages = messages.map(m => ({
    role: m.role,
    content: m.content
  }));

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: sanitizedMessages,
    temperature: 0.7,
    max_tokens: 2048,
  });
  return response.choices[0]?.message?.content || "";
}

const handleAnalyzeTone = asyncHandler(async (req, res) => {
  const text = req.body?.text;
  if (!text || typeof text !== "string" || !text.trim()) {
    return res.status(400).json({ error: "text is required" });
  }

  try {
    const raw = await runHuggingFaceInference(
      "j-hartmann/emotion-english-distilroberta-base",
      { inputs: text.trim() }
    );
    const analysis = normalizeClassifierOutput(raw);
    return res.status(200).json({
      model: "j-hartmann/emotion-english-distilroberta-base",
      analysis,
      topLabel: analysis[0]?.label || null,
      raw,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      error: error.message || "Failed to analyze tone",
      providerPayload: error.providerPayload || null,
    });
  }
});

const handleAnalyzePersonality = asyncHandler(async (req, res) => {
  const text = req.body?.text;
  if (!text || typeof text !== "string" || !text.trim()) {
    return res.status(400).json({ error: "text is required" });
  }

  try {
    if (!hfClient) {
      return res.status(500).json({
        error: "HF_TOKEN is not configured on the server",
      });
    }

    const raw = await hfClient.textClassification({
      model: "KevSun/Personality_LM",
      inputs: text.trim(),
      provider: "hf-inference",
    });
    const analysis = normalizeClassifierOutput(raw);
    return res.status(200).json({
      model: "KevSun/Personality_LM",
      analysis,
      topLabel: analysis[0]?.label || null,
      raw,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      error: error.message || "Failed to analyze personality",
      providerPayload: error.providerPayload || null,
    });
  }
});

const handleTextToSpeech = asyncHandler(async (req, res) => {
  const { text, language, playbackSpeed, voiceId: reqVoiceId } = req.body || {};
  if (!text || typeof text !== "string" || !text.trim()) {
    return res.status(400).json({ error: "text is required" });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "ELEVENLABS_API_KEY is not configured on server",
      source: "server_config",
    });
  }

  const voiceId = reqVoiceId || "CwhRBWXzGAHq8TQ4Fs17";

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": apiKey,
        },
        body: JSON.stringify({
          text: text.trim(),
          model_id: "eleven_multilingual_v2",
          output_format: "mp3_44100_128",
          voice_settings: {
            stability: 0.55,
            similarity_boost: 0.8,
            style: 0.25,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      let errorDetail = "ElevenLabs request failed";
      try {
        const errorBody = await response.text();
        const parsed = JSON.parse(errorBody);
        errorDetail = parsed.detail?.message || parsed.error || parsed.message || errorBody;
      } catch (_) {
        // keep the default error message
      }
      return res.status(response.status).json({
        error: errorDetail,
        source: "elevenlabs",
        status: response.status,
      });
    }

    const audioArrayBuffer = await response.arrayBuffer();
    const speed = Number(playbackSpeed) || 1;
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("X-TTS-Speed", String(speed));
    return res.send(Buffer.from(audioArrayBuffer));
  } catch (fetchError) {
    console.error("ElevenLabs fetch error:", fetchError);
    return res.status(502).json({
      error: `Failed to connect to ElevenLabs: ${fetchError.message}`,
      source: "network",
    });
  }
});

const getChat = asyncHandler(async (req, res) => {
  const counsellorType = req.params.counselorType;
  const language = req.query.language || "English";
  try {
    if (!req.user) {
      res.status(401);
      throw new Error("User not found");
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error("User not found in database");
    }

    const persona = getPersona(counsellorType);
    if (
      persona.requiresPro &&
      user.subscriptionTier !== "pro" &&
      user.subscriptionTier !== "enterprise"
    ) {
      res.status(403);
      throw new Error(`The ${counsellorType} persona requires a Pro subscription.`);
    }

    // 1. Get existing history if any
    const existingMessages = await Message.find({ userId: req.user._id, counsellorType }).sort({ createdAt: 1 });
    const systemPromptContent = await getSystemPrompt(counsellorType, "English", req.user._id);

    if (existingMessages.length > 0) {
      // Map stored messages back to the structure the frontend expects
      const history = existingMessages.map(m => ({
        role: m.role,
        content: m.content
      }));
      // Always prepend the system prompt so context isn't lost
      return res.status(200).json([
        { role: "system", content: systemPromptContent },
        ...history
      ]);
    }

    // 2. If no history, generate initial greeting
    const systemMessages = [
      {
        role: "system",
        content: systemPromptContent,
      },
    ];
    
    const initialGreeting = await getGroqResponse(systemMessages);
    const initialMessages = [
      ...systemMessages,
      { role: "assistant", content: initialGreeting }
    ];

    // Save the initial counselor message to DB (but not the system instructions)
    await Message.create({
      userId: req.user._id,
      role: "assistant",
      content: initialGreeting,
      counsellorType
    });

    user.sessionHistory.push({ date: new Date(), status: "started" });
    await user.save();
    res.status(200).json(initialMessages);
  } catch (err) {
    console.error("Error in getting chat", err);
    res.status(res.statusCode === 200 ? 500 : res.statusCode).send(err.message || "Internal Server Error");
  }
});

const handleSendChat = asyncHandler(async (req, res) => {
  try {
    let userMessages = req.body.messages;
    const counsellorType = req.body.counsellorType || "General";
    
    // Check for Pro tier if persona requires it
    const persona = getPersona(counsellorType);
    if (persona.requiresPro) {
      const user = await User.findById(req.user._id);
      if (user.subscriptionTier !== "pro" && user.subscriptionTier !== "enterprise") {
        res.status(403);
        throw new Error(`The ${counsellorType} persona requires a Pro subscription.`);
      }
    }
    
    // Ensure system message is present for context
    const hasSystemMsg = userMessages.some(m => m.role === "system");
    if (!hasSystemMsg) {
      const systemPrompt = await getSystemPrompt(counsellorType, "English", req.user._id);
      userMessages = [
        { role: "system", content: systemPrompt },
        ...userMessages
      ];
    }

    // 1. Identify the last user message
    const lastUserMsg = userMessages.filter(m => m.role === "user").pop();

    // 2. Run tone analysis in parallel (non-fatal if provider fails)
    let toneAnalysis = null;
    let detectedEmotion = null;
    if (lastUserMsg?.content) {
      try {
        const toneRaw = await runHuggingFaceInference(
          "j-hartmann/emotion-english-distilroberta-base",
          { inputs: lastUserMsg.content }
        );
        const analysis = normalizeClassifierOutput(toneRaw);
        detectedEmotion = analysis[0]?.label || null;
        toneAnalysis = {
          model: "j-hartmann/emotion-english-distilroberta-base",
          analysis,
          topLabel: detectedEmotion,
        };
      } catch (toneError) {
        console.warn("Tone analysis failed (non-fatal):", toneError.message);
        // Fallback: emotion remains null, will be stored as neutral
        detectedEmotion = null;
      }
    }

    // 3. Save user message to DB with detected emotion (or null for backward-compat)
    if (lastUserMsg && req.user) {
      await Message.create({
        userId: req.user._id,
        role: "user",
        content: lastUserMsg.content,
        counsellorType,
        emotion: detectedEmotion,
      });
    }

    // 4. Inject emotion as sanitized context into the AI prompt.
    //    Emotion only influences tone — placed as a system context prefix
    //    before the last user turn to avoid altering factual responses.
    //    The label is stripped of special chars to prevent prompt injection.
    // 5. Get AI response with emotion-aware context — using sanitized messages
    // 5. Get AI response with emotion-aware context
    let messagesForAI = [...userMessages];
    if (detectedEmotion) {
      const safeEmotion = detectedEmotion.replace(/[^a-zA-Z\s]/g, "").trim();
      if (safeEmotion) {
        // Insert emotion hint as a system message right before the last user message
        const lastUserIdx = messagesForAI.map(m => m.role).lastIndexOf("user");
        if (lastUserIdx !== -1) {
          messagesForAI.splice(lastUserIdx, 0, {
            role: "system",
            content: `[Contextual guidance for tone only — do not mention this to the user]: The user's current emotional state appears to be "${safeEmotion}". Adjust your communication style accordingly (e.g., more reassuring if anxious, more celebratory if joyful). This must not alter factual content.`,
          });
        }
      }
    }

    // 5. Get AI response with emotion-aware context
    let modelResponse = await getGroqResponse(messagesForAI);
    
    // 6. Extract Stress Level tag
    let stressScore = 5;
    const stressRegex = /\[\[STRESS_LEVEL:\s*(\d+)\]\]/;
    const match = modelResponse.match(stressRegex);
    if (match) {
      stressScore = parseInt(match[1]);
      modelResponse = modelResponse.replace(stressRegex, "").trim();
    }

    // 7. Save AI response
    if (req.user) {
      await Message.create({
        userId: req.user._id,
        role: "assistant",
        content: modelResponse,
        counsellorType,
      });
    }

    // 8. Award XP and update streak (non-fatal — runs after response is ready)
    if (req.user) {
      Promise.all([
        awardXP(req.user._id, 10),
        updateStreak(req.user._id),
      ]).catch(err =>
        console.warn("Gamification update failed (non-fatal):", err.message)
      );
    }

    res.status(200).json({ 
      text: modelResponse, 
      stressScore,
      toneAnalysis,
    });
  } catch (err) {
    console.error("Error processing chat request", err);
    res.status(500).send("Internal Server Error");
  }
});

const { 
  analyzeSessionCompletely, 
  generatePDFReport, 
  generateCSVReport 
} = require("../services/analysisService");
const fs = require("fs");
const path = require("path");

const handleCreateReport = asyncHandler(async (req, res) => {
  const { chat, userName, counsellorType } = req.body;
  if (!chat || chat.length === 0) {
    res.status(400);
    throw new Error("No chat history provided for analysis.");
  }

  try {
    // 1. Perform Deep AI Analysis
    const reportData = await analyzeSessionCompletely(req.user._id, chat, userName);
    if (!reportData) {
        throw new Error("Deep analysis failed to produce data.");
    }

    // 2. Generate File Names & Paths
    const reportId = Date.now().toString();
    const pdfFileName = `report_${req.user._id}_${reportId}.pdf`;
    const csvFileName = `report_${req.user._id}_${reportId}.csv`;
    
    // Ensure reports directory exists
    const reportsDir = path.join(__dirname, "../reports");
    if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
    }

    const pdfPath = path.join(reportsDir, pdfFileName);
    const csvPath = path.join(reportsDir, csvFileName);

    // 3. Generate Actual Files
    await generatePDFReport(reportData, userName, pdfPath);
    await generateCSVReport(reportData, csvPath);

    // 4. Update User History with file references
    const user = await User.findById(req.user._id);
    user.reportHistory.push({
      date: new Date(),
      title: `${counsellorType} Strategic Analysis`,
      pdfPath: pdfFileName,
      csvPath: csvFileName
    });
    await user.save();

    // 5. Return Data to Frontend (including the report content for the modal)
    return res.status(200).json({
        reportData,
        pdfUrl: `/api/v1/chat/download/${pdfFileName}`,
        csvUrl: `/api/v1/chat/download/${csvFileName}`
    });

  } catch (error) {
    console.error("Deep Analysis/Report Error:", error);
    res.status(500).json({ error: error.message || "Failed to finalize intelligence report." });
  }
});

const handleDownloadReport = asyncHandler(async (req, res) => {
    const { fileName } = req.params;
    const reportsDir = path.join(__dirname, "../reports");
    const filePath = path.join(reportsDir, fileName);

    // Security Check: Ensure the user is only downloading their own reports
    // Filenames are prefixed with userId: report_userId_reportId.pdf
    if (!req.user || !fileName.includes(req.user._id.toString())) {
        res.status(403);
        throw new Error("Unauthorized access to this report protocol.");
    }

    if (fs.existsSync(filePath)) {
        res.download(filePath);
    } else {
        res.status(404).json({ error: "Report file not found." });
    }
});

const handleCreateRoadmap = asyncHandler(async (req, res) => {
  const { chat } = req.body;
  try {
    const roadmapMessages = [
      ...(chat || []),
      {
        role: "system",
        content: `Based strictly on the preceding conversation, act as an expert helpful AI tracking counsellor. Construct a precise, step-by-step roadmap of improvement, actionable goals, or solutions to fix the specific issues discussed during this session. Output format MUST be strictly JSON (an array of objects), no extra markdown or text.`,
      },
      {
        role: "system",
        content: `Output format (strictly JSON, no markdown block wrappers expected):
          [{
            "Goal": "string (the main task or step to take)",
            "Description": "string (details on how the user can fulfill this step based on what was discussed)",
            "timeline": "string (estimated time)",
            "recommendations": [{"title": "string", "link": "string (a helpful search URL, like https://www.youtube.com/results?search_query=your+search+term or https://www.google.com/search?q=search+term to ensure links always work)"}],
            "isCompleted": false
          }]`,
      },
    ];

    const responseText = await getGroqResponse(roadmapMessages);
    console.log("Raw AI Roadmap Response:", responseText);
    
    // Safely extract JSON array if wrapped in markdown or extra text
    let cleaned = responseText.replace(/\[\[STRESS_LEVEL:\s*\d+\]\]/g, "").trim();
    
    // Robust extraction: find the first '[' and last ']'
    const startIdx = cleaned.indexOf('[');
    const endIdx = cleaned.lastIndexOf(']');
    
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        cleaned = cleaned.substring(startIdx, endIdx + 1);
    } else {
        // Fallback: try to strip markdown code blocks
        cleaned = cleaned.replace(/```json\s*/i, "").replace(/```\s*/g, "").trim();
    }
    
    console.log("Cleaned Roadmap JSON:", cleaned);

    // Final defensive cleanup for trailing commas or common AI hallucinations
    cleaned = cleaned.replace(/,\s*\]/g, "]"); 

    let roadmapData = [];
    try {
        roadmapData = JSON.parse(cleaned);
    } catch (parseError) {
        console.error("Critical: Failed to parse roadmap JSON even after cleanup:", cleaned);
        // Secondary attempt: if the AI just gave one object instead of an array
        try {
            const singleMatch = cleaned.match(/\{[\s\S]*\}/);
            if (singleMatch) {
                roadmapData = [JSON.parse(singleMatch[0])];
            } else {
                throw new Error("No JSON structure detectable.");
            }
        } catch (e) {
            console.error("AI Response Reconciliation Failed:", e.message);
            return res.status(500).json({ error: "AI response reconciliation failed. Please try again." });
        }
    }
    
    console.log("Parsed Roadmap Data Count:", roadmapData.length);
    
    await User.findOneAndUpdate(
      { email: req.user.email },
      { $set: { roadmap: roadmapData } }
    );
    console.log("User Roadmap Updated successfully");

    // Auto-Generate and Append Track to Journey
    try {
      const levels = generateLevelsFromRoadmap(roadmapData);
      console.log("Generated Levels for Journey:", levels.length);
      
      const newTrack = {
        id: "trk_" + Date.now().toString() + Math.floor(Math.random()*1000),
        title: roadmapData[0]?.Goal || roadmapData[0]?.title || "Strategic Growth Path",
        levels: levels
      };
      
      if (newTrack.levels.length > 0) {
        const journeyUpdate = await Journey.findOneAndUpdate(
          { userId: req.user._id },
          { 
            $push: { tracks: newTrack },
            $setOnInsert: { totalXP: 0 }
          },
          { upsert: true, new: true }
        );
        console.log("Journey Track Appended successfully:", journeyUpdate?._id);
      }
    } catch (journeyError) {
      console.error("Failed to append journey track (non-fatal):", journeyError);
    }

    return res.status(200).send(responseText);
  } catch (err) {
    console.error("Roadmap generation error:", err);
    res.status(500).json({ 
        success: false, 
        error: "Neural engine timeout or generation failure. Please try again in a moment.",
        details: err.message
    });
  }
});

const handleTaskUpdate = asyncHandler(async (req, res) => {
  const { roadmap } = req.body;
  try {
    await User.findOneAndUpdate(
      { email: req.user.email },
      { $set: { roadmap } }
    );
    res.status(200).json({ message: "Task updated" });
  } catch (error) {
    res.status(500).send("Error updating task");
  }
});

const handleRoadmapUpdation = asyncHandler(async (req, res) => {
  const { roadmap, messages } = req.body; 
  try {
    const updateMessages = [
      ...(messages || []),
      {
        role: "user",
        content: `Update this roadmap: ${JSON.stringify(roadmap)}. Provide next steps in the same JSON format.`,
      },
    ];

    const responseText = await getGroqResponse(updateMessages);
    return res.status(200).send(responseText);
  } catch (err) {
    console.error("Error updating roadmap:", err);
    res.status(500).send("Internal Server Error");
  }
});

/**
 * Revise roadmap steps from inline user comments (plan-style feedback).
 * Body: { steps: RoadmapStep[], comments: { stepIndex, quote, text }[] }
 */
const handleReviseRoadmap = asyncHandler(async (req, res) => {
  const { steps, comments } = req.body;
  if (!Array.isArray(steps) || steps.length === 0) {
    res.status(400);
    throw new Error("steps array is required");
  }
  if (!Array.isArray(comments) || comments.length === 0) {
    res.status(400);
    throw new Error("At least one comment is required to revise");
  }

  const feedbackLines = comments
    .map(
      (c, i) =>
        `${i + 1}. Step ${(c.stepIndex ?? 0) + 1}${c.quote ? ` (on "${c.quote}")` : ""}: ${c.text}`
    )
    .join("\n");

  const prompt = `You are editing a learning roadmap based on user feedback.

CURRENT ROADMAP (JSON):
${JSON.stringify(steps, null, 2)}

USER COMMENTS:
${feedbackLines}

Apply every comment. Keep the same number of steps unless a comment asks to add/remove steps.
Return ONLY a JSON object: { "steps": [ ... ] }. Each step must have:
- title (string)
- description (string)
- tasks (string array, 2-4 items)
- resources (array of { title, url } with 2-3 working https links per step)`;

  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
      response_format: { type: "json_object" },
      max_tokens: 2048,
    });

    let raw = response.choices[0]?.message?.content || "{}";
    // Be defensive: models sometimes wrap JSON with extra text.
    raw = String(raw).trim();
    const firstBrace = raw.indexOf("{");
    const lastBrace = raw.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      raw = raw.substring(firstBrace, lastBrace + 1);
    }

    let parsed = JSON.parse(raw);
    if (parsed.steps) parsed = parsed.steps;
    if (parsed.roadmap) parsed = parsed.roadmap;
    if (!Array.isArray(parsed)) {
      throw new Error("AI did not return a roadmap array");
    }

    return res.status(200).json({ steps: parsed });
  } catch (err) {
    console.error("Revise roadmap error:", err);
    res.status(500);
    throw new Error(err.message || "Failed to revise roadmap");
  }
});

/**
 * Commit chat roadmap to Journey map with todos.
 * Body: { title?: string, steps: RoadmapStep[] }
 */
const handleCommitRoadmapToJourney = asyncHandler(async (req, res) => {
  const { title, steps } = req.body;
  if (!Array.isArray(steps) || steps.length === 0) {
    res.status(400);
    throw new Error("steps array is required");
  }

  const levels = generateLevelsFromRoadmap(steps);
  if (levels.length === 0) {
    res.status(400);
    throw new Error("Could not build journey levels from steps");
  }

  const trackTitle =
    title?.trim() || steps[0]?.title || "Learning path";

  const newTrack = {
    id: "trk_" + Date.now().toString(),
    title: trackTitle,
    levels,
  };

  const journey = await Journey.findOneAndUpdate(
    { userId: req.user._id },
    {
      $push: { tracks: newTrack },
      $setOnInsert: { totalXP: 0 },
    },
    { upsert: true, new: true }
  );

  await User.findByIdAndUpdate(req.user._id, {
    $set: { roadmap: steps.map((s, i) => ({
      Goal: s.title,
      Description: s.description,
      title: s.title,
      description: s.description,
      recommendations: (s.resources || []).map((r) => ({
        title: r.title,
        link: r.url,
      })),
      isCompleted: false,
      order: i,
    })) },
  });

  return res.status(201).json({
    success: true,
    trackId: newTrack.id,
    journey,
  });
});

module.exports = {
  getChat,
  handleSendChat,
  handleAnalyzeTone,
  handleAnalyzePersonality,
  handleTextToSpeech,
  handleCreateReport,
  handleDownloadReport,
  handleCreateRoadmap,
  handleRoadmapUpdation,
  handleReviseRoadmap,
  handleCommitRoadmapToJourney,
  handleTaskUpdate,
};
