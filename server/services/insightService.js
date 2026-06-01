const Groq = require("groq-sdk");
const nodemailer = require("nodemailer");
const Message = require("../model/Message");
const Journey = require("../model/Journey");
const Insight = require("../model/Insight");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Aggregate all relevant user data for a given week.
 * Uses indexed queries (userId + createdAt) for performance.
 * Handles empty dataset gracefully.
 */
async function aggregateUserData(userId, weekStart) {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  // Indexed query: userId + createdAt range
  const messages = await Message.find({
    userId,
    createdAt: { $gte: weekStart, $lt: weekEnd },
  })
    .select("role content emotion createdAt")
    .lean();

  const userMessages = messages.filter((m) => m.role === "user");
  const totalMessages = userMessages.length;

  // Build emotion breakdown map
  const emotionBreakdown = {};
  for (const msg of userMessages) {
    if (msg.emotion) {
      emotionBreakdown[msg.emotion] = (emotionBreakdown[msg.emotion] || 0) + 1;
    }
  }

  // Count completed journey levels this week across all tracks
  const journey = await Journey.findOne({ userId }).lean();
  let levelsCompleted = 0;
  if (journey && journey.tracks) {
    // Flatten all levels from all tracks
    const allLevels = journey.tracks.flatMap(t => t.levels || []);
    levelsCompleted = allLevels.filter(
      (l) =>
        l &&
        l.status === "completed" &&
        l.completedAt &&
        new Date(l.completedAt) >= weekStart &&
        new Date(l.completedAt) < weekEnd
    ).length;
  }

  // Sample up to 20 messages for context (avoid token overflow)
  const messageSample = userMessages
    .slice(-20)
    .map((m) => m.content)
    .join("\n- ");

  return {
    totalMessages,
    emotionBreakdown,
    levelsCompleted,
    messageSample: messageSample || "No messages this week.",
    dominantEmotion:
      Object.entries(emotionBreakdown).sort((a, b) => b[1] - a[1])[0]?.[0] ||
      "neutral",
  };
}

/**
 * Build a strict JSON-returning Gemini prompt.
 * Prompt is structured to produce parseable output only.
 */
function buildInsightPrompt(userData, userName) {
  return `You are a professional learning coach analyzing a student's weekly activity on an AI mentoring platform.

STUDENT: ${userName}
WEEK ACTIVITY:
- Total messages sent: ${userData.totalMessages}
- Journey levels completed: ${userData.levelsCompleted}
- Dominant emotional state: ${userData.dominantEmotion}
- Emotion distribution: ${JSON.stringify(userData.emotionBreakdown)}
- Sample messages:
- ${userData.messageSample}

Based ONLY on the above data, produce a personalized, data-driven weekly insight report.

CRITICAL OUTPUT RULES:
1. Output ONLY a valid JSON object. No markdown, no code fences, no extra text.
2. Strings must not contain unescaped quotes.
3. All arrays must have 2-4 items.

Required JSON structure (no deviations):
{
  "summary": "2-3 sentence personalized summary referencing specific numbers from the data",
  "strengths": ["specific strength 1", "specific strength 2", "specific strength 3"],
  "weaknesses": ["specific area needing improvement 1", "specific area 2"],
  "suggestions": ["actionable suggestion 1", "actionable suggestion 2", "actionable suggestion 3"]
}`;
}

/**
 * Generate insight for a single user and save to DB.
 * Safely parses AI JSON with fallback on malformed output.
 */
async function generateInsight(userId, userName) {
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  weekStart.setUTCHours(0, 0, 0, 0);

  const userData = await aggregateUserData(userId, weekStart);

  // If zero activity, return a minimal insight rather than calling AI
  if (userData.totalMessages === 0 && userData.levelsCompleted === 0) {
    const emptyInsight = await Insight.findOneAndUpdate(
      { userId, weekStart },
      {
        userId,
        weekStart,
        summary: `${userName} had no recorded activity this week. Jump back in to make progress!`,
        strengths: [],
        weaknesses: ["No activity recorded this week"],
        suggestions: [
          "Start a new counseling session",
          "Review your learning roadmap",
          "Complete a journey level",
        ],
        emotionBreakdown: {},
        messagesAnalyzed: 0,
        levelsCompleted: 0,
        generatedAt: new Date(),
      },
      { upsert: true, new: true }
    );
    return emptyInsight;
  }

  const prompt = buildInsightPrompt(userData, userName);

  let insightData = null;
  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      response_format: { type: "json_object" }
    });
    
    insightData = JSON.parse(response.choices[0]?.message?.content);

    // Validate expected keys exist
    if (!insightData.summary || !insightData.strengths || !insightData.suggestions) {
      throw new Error("AI response missing required keys");
    }
  } catch (parseError) {
    console.error("Insight JSON parse failed, using fallback:", parseError.message);
    insightData = {
      summary: `${userName} completed ${userData.levelsCompleted} level(s) and sent ${userData.totalMessages} message(s) this week. Keep up the momentum!`,
      strengths: ["Active engagement this week"],
      weaknesses: ["Could not fully analyze this week's data"],
      suggestions: [
        "Continue your current learning path",
        "Aim to complete an additional journey level",
        "Reflect on your counseling sessions",
      ],
    };
  }

  // Save to DB only after successful generation
  const savedInsight = await Insight.findOneAndUpdate(
    { userId, weekStart },
    {
      userId,
      weekStart,
      summary: insightData.summary,
      strengths: insightData.strengths || [],
      weaknesses: insightData.weaknesses || [],
      suggestions: insightData.suggestions || [],
      emotionBreakdown: userData.emotionBreakdown,
      messagesAnalyzed: userData.totalMessages,
      levelsCompleted: userData.levelsCompleted,
      generatedAt: new Date(),
    },
    { upsert: true, new: true }
  );

  return savedInsight;
}

/**
 * Send a clean HTML email with the insight report.
 * Email is sent ONLY after successful DB save.
 * Includes basic retry (one retry on transient failure).
 */
async function sendInsightEmail(userEmail, userName, insight) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASS,
    },
  });

  const strengthsHTML = insight.strengths
    .map((s) => `<li style="margin-bottom:6px;">${s}</li>`)
    .join("");
  const weaknessesHTML = insight.weaknesses
    .map((w) => `<li style="margin-bottom:6px;">${w}</li>`)
    .join("");
  const suggestionsHTML = insight.suggestions
    .map((s) => `<li style="margin-bottom:6px;">${s}</li>`)
    .join("");

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:#18181b;padding:32px 40px;">
              <p style="margin:0;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#71717a;">Mind-Guide</p>
              <h1 style="margin:8px 0 0;font-size:22px;font-weight:600;color:#ffffff;">Your Weekly Insight</h1>
              <p style="margin:6px 0 0;font-size:13px;color:#a1a1aa;">Week of ${new Date(insight.weekStart).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
            </td>
          </tr>
          <!-- Summary -->
          <tr>
            <td style="padding:32px 40px 0;">
              <p style="margin:0;font-size:15px;line-height:1.7;color:#3f3f46;">${insight.summary}</p>
            </td>
          </tr>
          <!-- Stats row -->
          <tr>
            <td style="padding:24px 40px 0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#fafafa;border:1px solid #e4e4e7;border-radius:8px;padding:16px;text-align:center;width:33%;">
                    <p style="margin:0;font-size:24px;font-weight:700;color:#18181b;">${insight.messagesAnalyzed}</p>
                    <p style="margin:4px 0 0;font-size:11px;color:#71717a;text-transform:uppercase;letter-spacing:1px;">Messages</p>
                  </td>
                  <td width="12"></td>
                  <td style="background:#fafafa;border:1px solid #e4e4e7;border-radius:8px;padding:16px;text-align:center;width:33%;">
                    <p style="margin:0;font-size:24px;font-weight:700;color:#18181b;">${insight.levelsCompleted}</p>
                    <p style="margin:4px 0 0;font-size:11px;color:#71717a;text-transform:uppercase;letter-spacing:1px;">Levels Done</p>
                  </td>
                  <td width="12"></td>
                  <td style="background:#fafafa;border:1px solid #e4e4e7;border-radius:8px;padding:16px;text-align:center;width:33%;">
                    <p style="margin:0;font-size:16px;font-weight:700;color:#18181b;text-transform:capitalize;">${insight.dominantEmotion || "neutral"}</p>
                    <p style="margin:4px 0 0;font-size:11px;color:#71717a;text-transform:uppercase;letter-spacing:1px;">Mood</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Strengths -->
          <tr>
            <td style="padding:24px 40px 0;">
              <p style="margin:0 0 10px;font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:#71717a;">Strengths</p>
              <ul style="margin:0;padding-left:18px;color:#3f3f46;font-size:14px;line-height:1.6;">
                ${strengthsHTML}
              </ul>
            </td>
          </tr>
          <!-- Areas to improve -->
          <tr>
            <td style="padding:20px 40px 0;">
              <p style="margin:0 0 10px;font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:#71717a;">Areas to Improve</p>
              <ul style="margin:0;padding-left:18px;color:#3f3f46;font-size:14px;line-height:1.6;">
                ${weaknessesHTML}
              </ul>
            </td>
          </tr>
          <!-- Suggestions -->
          <tr>
            <td style="padding:20px 40px 0;">
              <p style="margin:0 0 10px;font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:#71717a;">This Week's Actions</p>
              <ul style="margin:0;padding-left:18px;color:#3f3f46;font-size:14px;line-height:1.6;">
                ${suggestionsHTML}
              </ul>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:32px 40px;border-top:1px solid #f4f4f5;margin-top:32px;">
              <p style="margin:0;font-size:12px;color:#a1a1aa;">You're receiving this because you have an active Mind-Guide account. Log in to see your full dashboard.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const mailOptions = {
    from: `"Mind-Guide" <${process.env.EMAIL}>`,
    to: userEmail,
    subject: `Your Weekly Learning Insight — ${new Date(insight.weekStart).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
    html,
  };

  const trySend = async () => {
    await transporter.sendMail(mailOptions);
  };

  try {
    await trySend();
  } catch (firstErr) {
    if (firstErr.message.includes("Invalid login") || firstErr.message.includes("535")) {
      console.error(`[SMTP ERROR] Authentication failed for ${process.env.EMAIL}. ACTION REQUIRED: Use a Gmail App Password (16 chars) instead of your regular password.`);
      return; // Do not retry if credentials are known to be bad
    }
    
    console.warn(`Email to ${userEmail} failed, retrying once:`, firstErr.message);
    try {
      await trySend();
    } catch (secondErr) {
      console.error(`Email to ${userEmail} failed after retry:`, secondErr.message);
    }
  }
}

module.exports = { generateInsight, sendInsightEmail, aggregateUserData };
