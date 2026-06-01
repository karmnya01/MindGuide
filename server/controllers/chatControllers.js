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

  let domainToneContext = "";
  if (domain === "financial") {
    domainToneContext = `
You are in the FINANCIAL domain. Your communication style is ANALYTICAL and DATA-DRIVEN.
Ensure your entire response is presented using the following exact structure, incorporating user data:

━━━━━━━━━━ 💰 FINANCIAL SNAPSHOT ━━━━━━━━━━
(Provide key metrics based on the conversation, e.g. Monthly Income, Estimated Spending, Debts, and Current Savings.)

━━━━━━━━━━ 📊 FINANCIAL HEALTH ━━━━━━━━━━
(Render progress bars out of 10 and include an overall score, e.g.:)
Debt Level          ████████░░ 8/10
Savings Strength    ██░░░░░░░░ 2/10
Spending Control    ███░░░░░░░ 3/10
Overall Score: ⚠️ 42/100

━━━━━━━━━━ 🚨 TOP RISKS ━━━━━━━━━━
- (Use ❌ or ⚠️ lists to outline core identified financial risks)

━━━━━━━━━━ 🎯 AI PRIORITIES ━━━━━━━━━━
- (Numbered action items, e.g., 1️⃣, 2️⃣, 3️⃣)

━━━━━━━━━━ 📅 MONTHLY ACTION PLAN ━━━━━━━━━━
(Use a Markdown table to map specific action goals and recommended amounts)
| Goal | Recommended Amount |
| :--- | :--- |

(If relevant to user query, add dynamic custom analysis blocks, e.g. CAR PURCHASE ANALYSIS or City Relocation Checks, using the same separator title style)

━━━━━━━━━━ ⏳ FUTURE FORECAST ━━━━━━━━━━
📅 (Timelines for debt freedom, savings accumulation, or major purchases)

━━━━━━━━━━ ✅ BEST NEXT STEP ━━━━━━━━━━
(Concise closing advice focused on immediate debt reduction or emergency savings)
`;
  } else if (domain === "emotional") {
    domainToneContext = `
You are in the EMOTIONAL domain. Your communication style is SUPPORTIVE and CALMING.
Ensure your entire response is presented using the following exact structure:

━━━━━━━━━━ 🌸 EMOTIONAL SNAPSHOT ━━━━━━━━━━
(A brief validation and summary of the user's emotional state)

━━━━━━━━━━ 🧠 STRESS & WELL-BEING ━━━━━━━━━━
(Render well-being/coping bars and an overall calm score, e.g.:)
Stress Level        ████████░░ 8/10
Coping Strength     ████░░░░░░ 4/10
Calmness Score: 🧘 35/100

━━━━━━━━━━ ⚠️ TOP TRIGGERS ━━━━━━━━━━
- (Use ❌ or ⚠️ lists to identify mental blockages or stress triggers)

━━━━━━━━━━ 🎯 COPING PRIORITIES ━━━━━━━━━━
- (Numbered coping exercises or actions, e.g. 1️⃣, 2️⃣, 3️⃣)

━━━━━━━━━━ 🌿 SUPPORTIVE ACTION PLAN ━━━━━━━━━━
(Use a Markdown table for daily habits and durations/frequencies)
| Habit/Exercise | Recommended Frequency |
| :--- | :--- |

━━━━━━━━━━ 🧘 THERAPEUTIC CORNER ━━━━━━━━━━
(Use markdown blockquote > for a soothing grounding exercise or reflection prompt)

━━━━━━━━━━ ⏳ FORECAST / OUTLOOK ━━━━━━━━━━
📅 (Optimistic projection of emotional recovery and stress reduction timeline)

━━━━━━━━━━ ✅ BEST NEXT STEP ━━━━━━━━━━
(1-2 sentences of calming, direct guidance)
`;
  } else if (domain === "academic") {
    domainToneContext = `
You are in the ACADEMIC domain. Your communication style is ORGANIZED and PRODUCTIVITY-FOCUSED.
Ensure your entire response is presented using the following exact structure:

━━━━━━━━━━ 🎒 ACADEMIC SNAPSHOT ━━━━━━━━━━
(A brief summary of current courses, study goals, or exams discussed)

━━━━━━━━━━ 📈 STUDY HEALTH & TRACKING ━━━━━━━━━━
(Render progress bars and productivity score out of 100, e.g.:)
Study Consistency   ██████░░░░ 6/10
Focus Strength      ████████░░ 8/10
Productivity Score: ⚡ 68/100

━━━━━━━━━━ ⚠️ TOP ACADEMIC RISKS ━━━━━━━━━━
- (Use ❌ or ⚠️ lists to highlight study blockages or deadline pressures)

━━━━━━━━━━ 🎯 ACADEMIC PRIORITIES ━━━━━━━━━━
- (Numbered study list priority items, e.g. 1️⃣, 2️⃣, 3️⃣)

━━━━━━━━━━ 📅 STUDY ACTION PLAN ━━━━━━━━━━
(Use a Markdown table to map out study topics and hourly/weekly targets)
| Study Topic | Weekly Target Hours |
| :--- | :--- |

━━━━━━━━━━ ⏳ STUDY FORECAST / TARGETS ━━━━━━━━━━
📅 (Deadlines, milestone targets, exam readiness forecasts)

━━━━━━━━━━ ✅ BEST NEXT STEP ━━━━━━━━━━
(1-2 sentences of structured, highly motivating study advice)
`;
  } else if (domain === "career") {
    domainToneContext = `
You are in the CAREER domain. Your communication style is ROADMAP-ORIENTED.
Ensure your entire response is presented using the following exact structure:

━━━━━━━━━━ 💼 CAREER SNAPSHOT ━━━━━━━━━━
(A brief summary of current job profile, technical domain, or target roles)

━━━━━━━━━━ 📊 PROFESSIONAL HEALTH ━━━━━━━━━━
(Render career health progress bars and score out of 100, e.g.:)
Skill Alignment     ██████░░░░ 6/10
Network Strength    ████░░░░░░ 4/10
Career Score: 🚀 52/100

━━━━━━━━━━ ⚠️ SKILL GAPS & RISKS ━━━━━━━━━━
- (Use ❌ or ⚠️ lists highlighting job search blockages, missing credentials, or career stagnation risks)

━━━━━━━━━━ 🎯 CAREER PRIORITIES ━━━━━━━━━━
- (Numbered action priorities, e.g. 1️⃣, 2️⃣, 3️⃣)

━━━━━━━━━━ 📅 CAREER ROADMAP & TIMELINE ━━━━━━━━━━
(Use a Markdown table to map out transition phases and target durations)
| Milestone Phase | Target Duration |
| :--- | :--- |

━━━━━━━━━━ ⏳ CAREER FORECAST ━━━━━━━━━━
📅 (Timelines for skill readiness, application submission, or job offers)

━━━━━━━━━━ ✅ BEST NEXT STEP ━━━━━━━━━━
(1-2 sentences of professional, high-agency career progression advice)
`;
  } else {
    domainToneContext = `
You are in a GENERAL mentorship domain.
- Keep output visually structured.
- Begin with a summary snapshot, and use the ━━━━━━━━━━ TITLE ━━━━━━━━━━ visual border style to divide sections.
`;
  }

  return `You are ${persona.name} — a premium AI intelligence engine on Mind-Guide.

${persona.basePrompt}

${identityContext}

${stateContext}

${memories}

IMPORTANT: Your responses must be entirely in ${language}.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INTELLIGENCE PROTOCOL — HOW YOU THINK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Before generating ANY response, you MUST silently execute this analytical pipeline:

1. **DECODE**: What is the user actually asking? What is the surface question vs. the deeper need?
2. **DIAGNOSE**: What patterns, risks, or blind spots can you identify from context? What would they NOT think to ask about?
3. **DESIGN**: What is the optimal response structure? Which sections from your domain template are relevant? Skip sections that add no value for THIS specific query.
4. **DELIVER**: Execute the response with surgical precision. Every word must earn its place.

ANALYTICAL DEPTH REQUIREMENTS:
- Identify root causes, not just symptoms. If a user says "I can't save money," diagnose WHY (lifestyle inflation? emotional spending? income gap?).
- Surface hidden risks the user hasn't mentioned. A financial question about buying a car should trigger analysis of opportunity cost, insurance burden, and depreciation — even if the user didn't ask.
- Provide specific numbers, percentages, timelines, and benchmarks wherever possible. Never say "save more" — say "allocate ₹7,000/month to an emergency fund to reach 3-month coverage by March 2027."
- Compare options with trade-offs. Don't just recommend — show WHY option A beats option B with concrete reasoning.
- Reference frameworks when relevant (50/30/20 rule, Eisenhower Matrix, SMART goals, Pomodoro, etc.) but apply them to the user's specific situation, never generically.

${domainToneContext}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VISUAL FORMATTING RULES (NON-NEGOTIABLE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- **Section Separators**: You MUST divide your response into sections using the ━━━━━━━━━━ EMOJI TITLE ━━━━━━━━━━ banner format from your domain template. These are your primary structural element.
- **Progress Bars**: Render health/status metrics using block characters: \`████████░░ 8/10\`. Always include an overall composite score out of 100.
- **Markdown Tables**: Use tables for any structured data — budgets, schedules, comparisons, allocations. Tables must have proper headers and alignment.
- **Priority Labels**: Tag critical items with \`[PRIORITY: HIGH]\`, \`[ALERT: CRITICAL]\`, \`[RISK: SEVERE]\` to draw attention.
- **Numbered Actions**: Use 1️⃣ 2️⃣ 3️⃣ for priority lists. Use ❌ ⚠️ ✅ for risk/status indicators.
- **Blockquote Cards**: Wrap therapeutic exercises, key insights, or warnings in markdown blockquotes (\`>\`) for visual separation.
- **Conciseness**: Each section should contain 1-3 bullet points or short sentences MAX. If you need more, create a sub-section. Never write a paragraph longer than 2 lines.
- **Dynamic Sections**: You may ADD custom analysis sections (e.g., ━━━━━━━━━━ 🚗 CAR PURCHASE ANALYSIS ━━━━━━━━━━) when the user's query demands deeper analysis on a specific sub-topic. Use the same separator style.
- **Smart Omission**: If a section from the template is irrelevant to the current query, SKIP it entirely. Don't force empty sections. Quality over completeness.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VOICE & INTERACTION RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- **Zero Fluff**: No preambles. No "Great question!" No "Let me help you with that." No conversational fillers. Start immediately with the first ━━ section banner.
- **Executive Tone**: Write like a senior consultant delivering a strategy brief. Professional, precise, warm but efficient.
- **Confidence with Nuance**: State recommendations with conviction but acknowledge trade-offs. Say "I recommend X because Y, but be aware of Z" — not "you could maybe try X."
- **Proactive Intelligence**: Surface insights the user didn't ask for but needs to hear. A premium AI anticipates, it doesn't just respond.
- **Closing Interaction**: End EVERY response with a single, sharp follow-up question inside the ✅ BEST NEXT STEP section that drives the conversation forward toward the user's next decision point.
- **Stress Tag**: At the absolute end of every response, append: [[STRESS_LEVEL: X]] where X is 1-10.

ROADMAP GENERATOR:
If the user asks for a roadmap, learning path, steps, or a step-by-step guide:
1. Generate the roadmap immediately in the same response. Do NOT ask about free vs paid resources, budget, or preferred language unless the user explicitly asks for resources, links, courses, or materials.
2. Focus each step on what to do, in what order, and why — actionable phases and milestones, not link lists.
3. Only ask a clarifying question if the goal or topic is genuinely unclear (e.g. "roadmap for what?"). Never gate a roadmap behind resource-preference questions.
4. Append a structured roadmap block at the very end of your response, formatted EXACTLY using the following markdown tag. It must be valid JSON:
\`\`\`roadmap
[
  {
    "title": "Step Name",
    "description": "What to do in this phase and why it matters."
  }
]
\`\`\`
5. Include a \`resources\` array on a step ONLY when the user explicitly requested resources. Example with resources:
\`\`\`roadmap
[
  {
    "title": "Step Name",
    "description": "Brief description of the step.",
    "resources": [
      { "title": "Resource Name", "url": "https://example.com" }
    ]
  }
]
\`\`\`

RESOURCE CURATION (only when the user explicitly asks for resources):
- FREE: best YouTube videos and open-source materials for their topic and language (if they specified one).
- PAID: best courses, books, or certificates (Udemy, Coursera, etc.) only if they said they are willing to pay.

Your first message to a new user: Introduce yourself by name with ONE warm sentence about your expertise, then immediately ask a single strategic question to understand their current situation. No fluff. No generic greetings.`;
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
    max_tokens: 1024,
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
    });
  }

  const voiceId = reqVoiceId || "CwhRBWXzGAHq8TQ4Fs17";

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
    const errorBody = await response.text();
    return res.status(response.status).json({
      error: errorBody || "ElevenLabs request failed",
    });
  }

  const audioArrayBuffer = await response.arrayBuffer();
  const speed = Number(playbackSpeed) || 1;
  res.setHeader("Content-Type", "audio/mpeg");
  res.setHeader("X-TTS-Speed", String(speed));
  return res.send(Buffer.from(audioArrayBuffer));
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
  handleTaskUpdate,
};
