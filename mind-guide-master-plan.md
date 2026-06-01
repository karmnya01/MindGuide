# MIND-GUIDE — MASTER PRODUCT, DESIGN & ENGINEERING BIBLE
> Version 1.0 | Complete Feature Roadmap + Design System + API Prompts + Git Strategy
> **Stack**: MERN · Gemini 1.5 Flash · Claude API · ElevenLabs · Stripe · Tailwind CSS

---

## TABLE OF CONTENTS

1. [Competitive Landscape Analysis](#1-competitive-landscape-analysis)
2. [Complete Feature Registry — All 17 Features](#2-complete-feature-registry)
3. [Design System & Brand Document](#3-design-system--brand-document)
4. [Claude API Prompt Library](#4-claude-api-prompt-library)
5. [Stripe Payment Integration Plan](#5-stripe-payment-integration-plan)
6. [Phased Implementation Roadmap](#6-phased-implementation-roadmap)
7. [Git Commit Strategy & Branch Architecture](#7-git-commit-strategy--branch-architecture)
8. [Database Schema Evolution Map](#8-database-schema-evolution-map)
9. [Environment & Config Reference](#9-environment--config-reference)

---

## 1. COMPETITIVE LANDSCAPE ANALYSIS

### 1.1 Direct Competitors

| Product | Core Strength | Fatal Weakness | Mind-Guide Advantage |
|---|---|---|---|
| **Khanmigo** (Khan Academy) | Socratic questioning, curriculum depth | Resets every session, no emotional layer, locked to KA content | Persistent memory, emotion-aware, user-defined goals |
| **Duolingo Max** | Gamification mastery, daily habit loops | Language-only, no mentorship, no emotional awareness | Domain-agnostic, counselor relationship, stress tracking |
| **Woebot** | Clinically grounded CBT, empathy | No learning/skill layer, no gamification, no progress tracking | Combines mental wellness + productive skill growth |
| **Wysa** | Emotional safety, evidence-based | Passive mood logging, no goals, no roadmaps | Active goal pursuit + emotional support in one product |
| **Headspace Ebb** | Mindfulness brand trust | Content consumption only, no personalization depth | AI-driven, adaptive, gamified with real behavioral tracking |
| **Notion AI** | Knowledge management | Not a coach, no accountability, no emotion layer | Relationship-based, emotionally aware, action-oriented |
| **Mentorbook** | User-uploaded content, flexibility | No emotional intelligence, no gamification | Better retention mechanics, emotional context, voice |

### 1.2 The Gap Mind-Guide Owns

No competitor combines all four pillars in one product:

```
PILLAR 1: Emotional Awareness   → Woebot does this, but no learning
PILLAR 2: Personalized Roadmaps → Khanmigo does this, but no memory
PILLAR 3: Gamified Progress     → Duolingo does this, but no mentorship
PILLAR 4: Behavioral Adaptation → Nobody does this at all
```

**Mind-Guide's category**: "Personal Growth Operating System" — not a tutoring app, not a wellness app, not a productivity app. It is the OS layer that runs underneath all three.

### 1.3 Design Inspiration Matrix

| Source | What to Borrow | What to Reject |
|---|---|---|
| **Duolingo** | XP bar, streak fire, pill badges, bottom-shadow buttons, progress tree | Owl mascot, language-specific UI, aggressive dark patterns |
| **Notion** | Warm surface palette, 720px reading column, document depth, dark mode warmth | Blank-page overwhelm, lack of visual delight |
| **Headspace** | Calm color transitions, generous whitespace, emotional color states | Passive consumption-only UX |
| **Linear** | Speed, keyboard shortcuts, status badges, ruthless information hierarchy | Developer-only mental model |
| **Reflect** | Journal entry aesthetic, time-based memory, gentle typography | No gamification, no social layer |

---

## 2. COMPLETE FEATURE REGISTRY

> **17 features total.** F01–F07: Architecture-native monetization features. F08–F17: Behavioral mechanics that don't rely on AI chat (user-contributed).

---

### F01 — PERSISTENT COUNSELOR MEMORY & RELATIONSHIP GRAPH
**Tier**: Pro | **Phase**: 2 | **Complexity**: Medium

**What it does**: After each session, a background job extracts structured memories (facts, goals, emotional patterns, milestones) from the conversation. These are injected into future sessions so the counselor remembers who you are.

**Model Changes**:
```javascript
// NEW: server/model/Memory.js
{
  userId: ObjectId,           // ref: User
  type: String,               // 'fact' | 'goal' | 'emotion_pattern' | 'milestone' | 'preference'
  content: String,            // "User struggles with consistency after 3+ days off"
  confidence: Number,         // 0.0 - 1.0 (AI-assigned confidence score)
  sourceSessionId: ObjectId,  // ref: Message session
  tags: [String],             // ['career', 'anxiety', 'coding']
  isActive: Boolean,          // user can deactivate memories
  createdAt: Date,
  lastReinforcedAt: Date      // bumped each time memory is confirmed
}
// INDEX: { userId: 1, type: 1, confidence: -1 }
// INDEX: { userId: 1, createdAt: -1 }
```

**Service**: `server/services/memoryService.js`
- `extractMemories(userId, messages[])` — calls Gemini API post-session
- `injectMemories(userId)` — returns top 10 memories as formatted string for system prompt
- `reinforceMemory(memoryId)` — bumps lastReinforcedAt when same fact appears again
- `deactivateMemory(memoryId)` — user-triggered removal

**Controller Changes**: Modify `getSystemPrompt()` in `chatControllers.js`:
```javascript
const memoryContext = await memoryService.injectMemories(userId);
// Prepend to system prompt:
// "WHAT YOU REMEMBER ABOUT THIS USER:\n" + memoryContext
```

**New Routes**:
```
GET  /memory              → list user's memories (paginated)
PATCH /memory/:id/deactivate → soft delete a memory
GET  /memory/stats        → count by type, confidence distribution
```

**Frontend**: Memory Vault page (`/vault`) showing cards grouped by type. Each card shows content, date, confidence bar, deactivate button. Accessible from Dashboard sidebar.

**Paywall**: Free = last session only (no persistence). Pro = full vault, unlimited memories, manual corrections.

---

### F02 — BURNOUT PREDICTION & EARLY WARNING SYSTEM
**Tier**: Pro | **Phase**: 1 | **Complexity**: Low-Medium

**What it does**: Computes a 0–100 Burnout Risk Score weekly from emotion ratios, stress scores, session frequency, and streak decline. Adds proactive counselor check-ins when score rises.

**Model Changes**:
```javascript
// ADD to server/model/Insight.js:
burnoutScore: { type: Number, min: 0, max: 100, default: null },
burnoutTrend: { type: String, enum: ['stable', 'rising', 'critical'], default: 'stable' },
energyLevel: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' }
```

**Service**: `server/services/burnoutService.js`
```javascript
// Algorithm (v1):
// negativeEmotions = count(anxious + stressed + sad + overwhelmed messages in last 7 days)
// totalMessages = count(all messages in last 7 days)
// emotionRatio = negativeEmotions / totalMessages
// streakPenalty = max(0, (lastStreakPeak - currentStreak) / lastStreakPeak)
// sessionFreqDrop = max(0, 1 - (sessionsThisWeek / avgSessionsPerWeek))
// burnoutScore = (emotionRatio * 50) + (streakPenalty * 30) + (sessionFreqDrop * 20)
// Clamped 0-100. Round to integer.
```

**CRON Integration**: Add `burnoutService.computeForUser(userId)` inside existing weekly insights CRON.

**Frontend**: Wellness Gauge widget on Dashboard. Single arc gauge (0-100) + trend arrow + color state (green/amber/red). On 'critical': counselor opens proactively on next chat load with check-in message.

**Paywall**: Free = current week energy level (High/Medium/Low text only). Pro = score, 4-week trend chart, proactive check-ins, recovery mode activation.

---

### F03 — GOAL COMMITMENT CONTRACTS WITH CHECK-IN LOOPS
**Tier**: Free (basic) + Pro (advanced) | **Phase**: 1 | **Complexity**: Low

**What it does**: Users set a deadline for any Journey level. The system sends structured check-in emails and surfaces a check-in banner inside the chat on scheduled days.

**Model Changes**:
```javascript
// NEW: server/model/Contract.js
{
  userId: ObjectId,
  journeyTrackId: String,
  levelId: String,
  commitmentDeadline: Date,
  checkInFrequency: String,    // 'daily' | 'every3days' | 'weekly'
  checkInDates: [Date],        // pre-computed schedule
  status: String,              // 'active' | 'completed' | 'overdue' | 'abandoned'
  remindersSent: Number,
  completedAt: Date,
  createdAt: Date
}
// INDEX: { userId: 1, status: 1 }
// INDEX: { checkInDates: 1 }   ← for CRON query
```

**Service**: `server/services/contractService.js`
- `createContract(userId, levelId, deadline, frequency)` — generates checkInDates array
- `processCheckIns()` — CRON: finds contracts with today in checkInDates, sends email via Nodemailer
- `markComplete(contractId)` — triggered from PATCH /journey/progress

**Paywall**: Free = 1 active contract, weekly check-in emails. Pro = unlimited contracts, daily check-ins, overdue recovery mode, completion certificates.

---

### F04 — ADAPTIVE ASSESSMENT ENGINE WITH SPACED REPETITION
**Tier**: Pro | **Phase**: 2 | **Complexity**: Medium

**What it does**: Assessment difficulty adapts based on history + current emotional state. Completed levels resurface for spaced repetition review based on performance and time elapsed.

**Model Changes**:
```javascript
// ADD to server/model/User.js:
assessmentHistory: [{
  levelId: String,
  attemptDate: Date,
  score: Number,          // 0-100
  difficulty: Number,     // 1-5
  passed: Boolean,
  wrongQuestions: [String] // question text for review
}]
// INDEX: { 'assessmentHistory.levelId': 1 }
```

**Service Changes** (`server/services/journeyService.js`):
```javascript
// getAdaptiveDifficulty(userId, levelId):
//   → if no history: return 3 (default)
//   → if last attempt score < 60: return difficulty - 1
//   → if last attempt score > 85 and passed: return difficulty + 1
//   → if current burnoutScore > 60: cap difficulty at 2 (stress accommodation)

// getReviewQueue(userId):
//   → find levels where: passed AND attemptDate < 7 days ago AND score < 80
//   → sort by (7 - daysSinceAttempt) * (1 - score/100), return top 5
```

**Paywall**: Free = standard 3-question quiz. Pro = adaptive difficulty, spaced repetition queue, wrong-answer explanations, topic analytics.

---

### F05 — SESSION DEBRIEF & SHAREABLE PROGRESS REPORTS
**Tier**: Free (basic) + Pro (rich) | **Phase**: 1 | **Complexity**: Very Low

**What it does**: After 8+ messages, a "Wrap Session" button appears. Clicking generates a structured 3-part debrief: what was worked on, emotional arc, key insights + next suggested action.

**Model Changes**:
```javascript
// ADD to server/model/Insight.js:
sessionDebriefs: [{
  sessionDate: Date,
  summary: String,
  emotionalArc: String,     // "started anxious → ended motivated"
  keyInsights: [String],    // 3 bullet points
  nextAction: String,
  xpEarned: Number,
  shareToken: String,       // UUID, null by default
  shareExpiry: Date
}]
```

**Routes**:
```
POST /insights/debrief     → generate debrief for current session
POST /insights/debrief/share/:token  → generate public share link
GET  /public/debrief/:token          → public view (no auth)
```

**Paywall**: Free = text debrief inline in chat. Pro = PDF export, shareable link, emotion arc visualization, debrief history.

---

### F06 — PREMIUM PERSONA DEEP SPECIALIZATION
**Tier**: Pro | **Phase**: 1 | **Complexity**: Low

**What it does**: Gate high-quality, domain-specialist counselor personas behind the Pro tier. Each premium persona has a distinct system prompt, voice (ElevenLabs voice ID), and memory category set.

**Model Changes**:
```javascript
// ADD to server/model/User.js:
subscriptionTier: { type: String, enum: ['free', 'pro', 'enterprise'], default: 'free' },
subscriptionExpiry: Date,
stripeCustomerId: String,
stripeSubscriptionId: String
```

**Premium Persona Definitions** (`chatControllers.js`):
```javascript
const PREMIUM_PERSONAS = {
  'senior-engineer': { requiresPro: true, voiceId: 'elevenlabs-id-1' },
  'therapy-inspired': { requiresPro: true, voiceId: 'elevenlabs-id-2' },
  'startup-founder': { requiresPro: true, voiceId: 'elevenlabs-id-3' },
  'language-coach': { requiresPro: true, voiceId: 'elevenlabs-id-4' },
  'burnout-recovery': { requiresPro: true, voiceId: 'elevenlabs-id-5' }
};
```

**Paywall**: Free = General, Technical, Career (basic prompts). Pro = 5 specialist personas with deep system prompts and unique voices.

---

### F07 — B2B TEAM WELLNESS & LEARNING DASHBOARD
**Tier**: Enterprise | **Phase**: 3 | **Complexity**: High

**What it does**: Organization accounts with manager dashboards showing anonymized team burnout scores, learning velocity, and engagement trends.

**Model Changes**:
```javascript
// NEW: server/model/Organization.js
{
  name: String,
  adminUserId: ObjectId,
  memberIds: [ObjectId],
  plan: String,               // 'team' | 'enterprise'
  seatsAllowed: Number,
  dataConsentVersion: String, // GDPR consent tracking
  createdAt: Date
}
// ADD to User.js:
organizationId: ObjectId,     // ref: Organization
dataSharedWithOrg: Boolean,   // explicit consent flag — DEFAULT FALSE
orgRole: String               // 'member' | 'admin'
```

**Privacy Rule**: All team views aggregate minimum 5 users before showing data. Individual drill-down only available to self and admin after explicit consent.

---

### F08 — PARALLEL SELVES SYSTEM
**Tier**: Pro | **Phase**: 2 | **Complexity**: Medium

**What it does**: Users create named "self-states" (Sprint Self, Recovery Self, Exam Mode, etc.). When a self is active, the entire app restructures: different goals are shown, different workload expectations, different counselor tone, different XP multipliers.

**Core Insight**: Humans don't have one consistent personality. An app that fights this fights reality. Mind-Guide should model human psychological fragmentation as a feature, not a bug.

**Model Changes**:
```javascript
// NEW: server/model/SelfState.js
{
  userId: ObjectId,
  name: String,                // "Sprint Self", "Recovery Self"
  emoji: String,               // User-chosen
  type: String,                // 'sprint' | 'recovery' | 'maintenance' | 'exploration' | 'custom'
  isActive: Boolean,
  config: {
    xpMultiplier: Number,      // 0.5 (recovery) → 2.0 (sprint)
    dailyGoalCount: Number,    // # of goals shown per day
    checkInFrequency: String,  // 'gentle' | 'normal' | 'aggressive'
    counselorTone: String,     // injected into system prompt
    allowedTracks: [String],   // which journey tracks are accessible
    maxDailyEnergy: Number     // links to Energy Budget system (F10)
  },
  activatedAt: Date,
  sessionCount: Number         // # of sessions while in this state
}
// ADD to User.js:
activeSelfStateId: ObjectId    // ref: SelfState
selfStates: [ObjectId]
```

**Service**: `server/services/selfStateService.js`
- `activateSelfState(userId, stateId)` — switches active state, adjusts counselor prompt
- `getSelfStateContext(userId)` — returns formatted string for system prompt injection
- `logStateTransition(userId, fromState, toState)` — for behavioral analytics

**Frontend**: Self Selector on Dashboard header. Animated state switcher with visual identity per self. Each self has a distinct color accent and dashboard layout.

**Paywall**: Free = 2 self-states (Focus + Recovery). Pro = unlimited custom selves, full config control, self analytics over time.

---

### F09 — REVERSE STREAKS (RESILIENCE RECOVERY SCORE)
**Tier**: Free | **Phase**: 1 | **Complexity**: Very Low

**What it does**: Eliminates shame-based streak collapse. Instead of tracking consecutive days, the system awards a "Recovery Score" for how quickly a user returns after a lapse. Fast recovery → score increases. This directly combats the shame spiral that kills retention.

**Core Insight**: Traditional streaks punish failure. This system rewards the act of coming back.

**Model Changes**:
```javascript
// ADD to server/model/User.js:
recoveryScore: { type: Number, default: 0 },    // 0-100, career lifetime stat
recoveryEvents: [{
  lapseDate: Date,          // day streak broke
  returnDate: Date,         // day user came back
  daysOut: Number,          // gap
  recoveryXP: Number        // XP awarded for returning
}],
longestRecovery: Number,    // personal best (fastest return after collapse)
totalCollapses: Number      // lifetime counter
```

**Gamification Logic** (`gamificationService.js`):
```javascript
// On session start, check if streak was broken yesterday or before:
// IF gap === 1 day: recoveryScore += 15, "Quick Recovery!" badge candidate
// IF gap === 2-3 days: recoveryScore += 10
// IF gap === 4-7 days: recoveryScore += 5
// IF gap > 7 days: recoveryScore += 2 (always reward return)
// Award XP proportional to recovery speed: floor(50 / daysOut)
// Never penalize for returning. Only reward.
```

**Frontend**: Replace "🔥 Streak Lost" toast with "⚡ Recovery Mode — +X recovery points for coming back". Streak counter still shows (for consistency users who love it), but Recovery Score is equally prominent. Recovery leaderboard on shared spaces (F17).

**Cost to implement**: ~4 hours. Highest value-to-effort ratio of all 17 features.

---

### F10 — ENERGY BUDGETING SYSTEM
**Tier**: Pro | **Phase**: 2 | **Complexity**: Medium

**What it does**: Users manage daily mental energy instead of time. Each activity has an energy cost. The app helps users avoid cognitive overload by visualizing their energy budget and warning when it's depleted.

**Core Insight**: Time is not the bottleneck for modern learners. Energy is. This reframes the entire productivity conversation.

**Model Changes**:
```javascript
// NEW: server/model/EnergyProfile.js
{
  userId: ObjectId,
  dailyBudget: Number,        // default 100
  activities: [{
    name: String,             // "Deep Coding", "Quiz", "Social", "Exercise"
    energyCost: Number,       // set by user or AI-suggested
    category: String          // 'learning' | 'social' | 'physical' | 'recovery'
  }],
  dailyLog: [{
    date: Date,
    startingEnergy: Number,
    activities: [{activityName: String, energySpent: Number, time: Date}],
    remainingEnergy: Number,
    overbudget: Boolean
  }],
  avgEnergyPerDay: Number,    // rolling 7-day average
  overbudgetDays: Number      // rolling 7-day count
}
```

**Integration Points**:
- When energy is low (< 20%), journeyService reduces recommended daily goal count
- Assessment difficulty engine (F04) considers energy level
- SelfState config (F08) sets maxDailyEnergy per self
- Burnout Score (F02) incorporates chronic overbudget days

**Frontend**: Energy bar on Dashboard (horizontal, color-coded: green > 50, amber 20-50, red < 20). Activity log widget. "Energy Cost" tag on each Journey level card. Day planner mode that auto-schedules activities within budget.

**Paywall**: Free = manual energy tracking. Pro = AI-suggested activity costs based on behavior, energy forecasting, overbudget alerts.

---

### F11 — PERSONAL ECONOMY SYSTEM
**Tier**: Pro | **Phase**: 3 | **Complexity**: High

**What it does**: A full internal currency and economy. Users earn "Focus Capital" from completing goals. Burnout reduces their earning multiplier. Consistency compounds rewards. Bad habits create "momentum debt." The system creates investment psychology around self-improvement.

**Core Insight**: Humans understand economies intuitively. Money, debt, investment, compound growth — these mental models map perfectly onto habit psychology. This feature makes abstract personal growth feel like running a business.

**Model Changes**:
```javascript
// ADD to server/model/User.js:
economy: {
  focusCapital: Number,           // primary currency
  earningMultiplier: Number,      // 0.5x (burnout) → 3.0x (on-fire streak)
  momentumDebt: Number,           // accumulated from broken commitments
  weeklyEarnings: Number,         // this week's focus capital earned
  lifetimeCapital: Number,        // never decreases, total ever earned
  compoundStreak: Number,         // consecutive weeks with positive economy
  lastAudit: Date                 // date of last economy recalculation
}
```

**Economy Rules** (`economyService.js`):
```javascript
// EARNING:
// Complete a level:    +50 FC * earningMultiplier
// Daily check-in:      +10 FC
// Streak day:          +5 FC * streakLength (capped at 7)
// Recovery return:     +30 FC (reward for coming back)

// MULTIPLIER CHANGES:
// Burnout score > 70:  multiplier *= 0.7
// Streak > 7 days:     multiplier *= 1.2
// Overbudget 3+ days:  multiplier *= 0.85
// Compound week:        multiplier *= 1.1

// DEBT:
// Broken contract:     +25 momentum debt
// Debt > 100:          multiplier *= 0.8 until debt repaid
// Debt repayment:      Any completed goal reduces debt by 10
```

**Frontend**: Economy dashboard widget. Mini "portfolio view" showing earnings chart. Multiplier displayed as a ×1.4 badge. Debt shown as red "-X MD" counter. Unlock cosmetic items with Focus Capital (avatar frames, counselor themes).

**Paywall**: Free = see your current FC balance. Pro = full economy dashboard, multiplier history, debt management, FC-unlockable cosmetics.

---

### F12 — LIFE SEASONS ENGINE
**Tier**: Free | **Phase**: 2 | **Complexity**: Medium

**What it does**: The app detects and labels the user's current "life season" (Rebuilding, Exploration, Survival, Mastery, Transition, Sprint) based on behavioral signals. The entire product recalibrates expectations, pace, and goals for that season.

**Core Insight**: Most apps assume constant optimization. Humans live in seasons. An app that fights this loses. An app that embraces it becomes a trusted companion.

**Detection Logic** (`seasonService.js`):
```javascript
// SEASON DETECTION (run weekly):
// "Survival":     burnoutScore > 75 OR sessions < 2/week for 3 weeks
// "Rebuilding":   returning after 7+ day absence OR recovery event
// "Exploration":  high session count + frequent persona switching + diverse topics
// "Sprint":       SelfState = 'sprint' OR 7-day streak + high XP velocity
// "Mastery":      95%+ level completion + low burnout + 30+ day streak
// "Transition":   topic shift detected in last 10 messages (career change signal)
// DEFAULT:        "Maintenance"

// Season changes trigger:
// - System notification: "You've entered a Rebuilding Season"
// - Counselor tone adjustment
// - Journey map reordering (easier levels surfaced during Survival)
// - XP expectations adjusted (lower bar during Survival/Rebuilding)
```

**Model Changes**:
```javascript
// ADD to server/model/User.js:
currentSeason: { type: String, enum: ['survival', 'rebuilding', 'exploration', 'sprint', 'mastery', 'transition', 'maintenance'], default: 'maintenance' },
seasonHistory: [{ season: String, startDate: Date, endDate: Date, notes: String }]
```

**Frontend**: Season badge on Dashboard header with season-specific color and icon. Counselor opening message references current season. Journey map shows season-appropriate sorting. Weekly email subject line changes per season.

**Paywall**: Free tier gets season detection and basic adjustments. Pro gets full history, season analytics, manual override.

---

### F13 — SOCIAL GRAVITY SYSTEM (SHARED MOMENTUM SPACES)
**Tier**: Pro | **Phase**: 3 | **Complexity**: High

**What it does**: Small accountability groups (4-8 people) with shared momentum mechanics. Group members affect each other's XP multiplier through a "gravitational field" — high-momentum members lift others, low-activity members create drag. Creates emergent social behavior.

**Core Insight**: The best retention tool is humans holding each other accountable. This creates network effects that make churning feel like abandoning people, not just an app.

**Model Changes**:
```javascript
// NEW: server/model/MomentumSpace.js
{
  name: String,
  creatorId: ObjectId,
  members: [{
    userId: ObjectId,
    joinedAt: Date,
    momentumScore: Number,     // 0-100, recalculated daily
    gravitationalPull: Number  // positive = lifts group, negative = drags
  }],
  groupMomentum: Number,       // weighted average of all members
  weeklyActivity: Number,      // total sessions across all members
  spaceType: String,           // 'study' | 'career' | 'wellness' | 'custom'
  isPrivate: Boolean,
  inviteCode: String,
  maxMembers: Number           // default 8
}
```

**Gravitational Pull Formula**:
```javascript
// memberGravity = (sessionFrequency * 0.4) + (streakScore * 0.3) + (xpVelocity * 0.3)
// If member gravity > groupAverage: they contribute positive pull
// If member gravity < groupAverage: neutral (no negative punishment — avoid shame)
// groupMomentumMultiplier = 1 + (sum(positivePulls) / memberCount * 0.2)
// Members in high-gravity groups earn +20% XP passively
```

**Frontend**: Space page showing live momentum visualization (animated gravity field). Member cards with momentum scores. Group streak counter. Weekly "Space Highlights" digest email.

**Paywall**: Free = join 1 public space (read-only). Pro = create spaces, private spaces, momentum analytics.

---

### F14 — FRICTION MAPPING
**Tier**: Pro | **Phase**: 3 | **Complexity**: High

**What it does**: The system detects not where users fail, but where they hesitate. Patterns like "always delays coding tasks," "quits after difficult quizzes," "opens app at night but closes quickly" are detected and visualized as a personal "friction map."

**Core Insight**: Outcomes are lagging indicators. Friction is a leading indicator. Detecting where the user psychologically resists action before failure happens is genuinely novel.

**Data Collection**:
```javascript
// ADD to client tracking:
// - Time between page load and first action (hesitation)
// - Number of task hovers without clicks (avoidance)
// - Session abandonment point (which level/section was open)
// - Time-of-day patterns per activity type

// ADD to server/model/FrictionEvent.js:
{
  userId: ObjectId,
  eventType: String,    // 'hover_no_click' | 'quick_abandon' | 'delayed_start' | 'repeated_deferral'
  context: String,      // 'coding_level' | 'quiz' | 'roadmap' | 'chat'
  timestamp: Date,
  metadata: Object      // levelId, timeOfDay, sessionLength etc.
}
```

**Analysis Service** (`frictionService.js`):
- Run weekly analysis: cluster friction events by context
- Generate "friction zones" report: top 3 resistance patterns
- Inject friction context into counselor system prompt: "User typically avoids coding tasks on weekday evenings"

**Frontend**: Friction Map visualization (heatmap-style) on Analytics Dashboard. Counselor proactively addresses top friction zone once per week.

**Paywall**: Pro-only feature. Position as "the most honest thing an app has ever told you about yourself."

---

### F15 — IDENTITY DRIFT DETECTION
**Tier**: Pro | **Phase**: 2 | **Complexity**: Medium

**What it does**: The system tracks the gap between the user's stated identity ("I want to be disciplined") and their actual behavior patterns. When significant drift is detected, the counselor gently surfaces it — not as criticism, but as an observation.

**Core Insight**: People are motivated by identity consistency. When behavior drifts from identity, the discomfort is a powerful motivational signal. Most apps ignore this. Mind-Guide surfaces it with empathy.

**Implementation**:
```javascript
// ADD to server/model/User.js:
identityStatements: [{
  statement: String,       // "I want to be a consistent learner"
  capturedAt: Date,
  extractedFrom: String    // 'onboarding' | 'chat' | 'manual'
}]

// DRIFT DETECTION (weekly, in insights CRON):
// 1. Pull latest identity statements from User model
// 2. Pull behavioral summary (sessions/week, completion rate, burnout score)
// 3. Call Gemini API with both → returns driftScore (0-100) and driftSummary
// 4. If driftScore > 60 AND trend is increasing: inject into next counselor session
```

**Frontend**: Identity Dashboard section: stated values + behavior heatmap. Drift score shown as a "Alignment" percentage. Counselor references alignment naturally in conversation, never as accusation.

**Paywall**: Pro. The identity layer makes counselor feel deeply personal and insightful.

---

### F16 — ADAPTIVE ENVIRONMENT SYSTEM
**Tier**: Pro | **Phase**: 3 | **Complexity**: High

**What it does**: The app's interaction philosophy changes based on long-term behavioral patterns. Users who respond poorly to pressure get softer systems. Users who thrive on competition get aggressive systems. This is not just theme switching — it's the entire UX adapting.

**Implementation**:
```javascript
// ADD to server/model/User.js:
adaptiveProfile: {
  pressureResponse: String,      // 'thrives' | 'neutral' | 'buckles'
  competitionAffinity: Number,   // 0-100
  sustainabilityNeed: Number,    // 0-100 (high = needs gentle pacing)
  autonomyPreference: Number,    // 0-100 (high = hates being told what to do)
  lastProfiledAt: Date
}
```

**Profiling Logic**: Run after 20+ sessions. Analyze session completion rates under different conditions (high-pressure notifications vs. gentle, competitive vs. collaborative framing). Build profile. Map to one of 4 UX archetypes:
- **Competitor**: Leaderboards prominent, aggressive XP display, challenge framing
- **Achiever**: Progress bars, completion percentages, milestone celebrations
- **Explorer**: Discovery framing, no strict deadlines, curiosity-driven prompts
- **Nurtured**: Warm counselor tone, no aggressive notifications, recovery-first

**Frontend**: Silent UX change (no announcement). Users just notice the app "feels right." Advanced settings let Pro users see and override their adaptive profile.

---

### F17 — MOMENTUM INSURANCE (EMERGENCY HABIT PROTOCOLS)
**Tier**: Free | **Phase**: 2 | **Complexity**: Low

**What it does**: Before a predicted difficult period (exam week, travel, life event), users build "backup systems" — minimum viable habits that activate automatically when the app detects collapse. Like financial insurance, but for consistency.

**Core Insight**: The best time to build a fallback system is before you need it. Most people build emergency plans during the crisis, which is too late.

**Implementation**:
```javascript
// NEW: server/model/MomentumInsurance.js
{
  userId: ObjectId,
  name: String,               // "Finals Week Protocol"
  triggerConditions: [{
    metric: String,           // 'burnout_score' | 'streak_broken' | 'session_gap'
    threshold: Number,
    operator: String          // 'gt' | 'lt' | 'eq'
  }],
  emergencyRoutine: {
    dailyGoals: [String],     // minimum viable goal list
    checkInFrequency: String, // 'gentle'
    xpMultiplier: Number,     // reduced target
    activationMessage: String // what the counselor says when activated
  },
  isActive: Boolean,
  lastActivated: Date,
  timesActivated: Number
}
```

**Trigger Check**: Add to daily CRON — check all users' insurance trigger conditions. If met: activate insurance protocol, switch SelfState to 'survival', send activation notification.

**Frontend**: "Insurance Plans" section in Settings. Template library (Finals Week, Travel Mode, High-Stress Period, New Job). One-click activation or auto-trigger setup.

---

## 3. DESIGN SYSTEM & BRAND DOCUMENT

### 3.1 Brand Identity

**Product Category**: Personal Growth Operating System
**Brand Personality**: A wise, calm friend who knows you deeply — not a clinical tool, not a gamified app, not a chatbot. Something entirely new.
**Aesthetic Direction**: "Focused Depth" — the intersection of Notion's document calm and Duolingo's motivational energy. Dark-first, warm-toned, intentional.

### 3.2 Color System

#### Primary Palette (CSS Custom Properties)

```css
:root {
  /* === BRAND PRIMARIES === */
  --mg-indigo-900: #1A1040;    /* Deep background, darkest surface */
  --mg-indigo-800: #231553;    /* Elevated surface in dark mode */
  --mg-indigo-700: #2D1B69;    /* Card background dark */
  --mg-indigo-500: #4F35B8;    /* Primary brand — buttons, CTAs, active states */
  --mg-indigo-400: #6B52D4;    /* Hover states */
  --mg-indigo-300: #8B72E8;    /* Borders, subtle accents */
  --mg-indigo-100: #C4B8F5;    /* Muted text on dark bg */
  --mg-indigo-050: #EEF0FF;    /* Light mode surface tint */

  /* === EMOTIONAL STATES (for emotion/burnout UI) === */
  --mg-calm:     #22C55E;     /* Low stress, healthy — green */
  --mg-focus:    #3B82F6;     /* Concentration, deep work — blue */
  --mg-caution:  #F59E0B;     /* Moderate stress, watch out — amber */
  --mg-stress:   #EF4444;     /* High burnout, danger — red */
  --mg-recover:  #A78BFA;     /* Recovery mode, rest — soft purple */
  --mg-sprint:   #FB923C;     /* Sprint self, high energy — orange */

  /* === NEUTRAL SURFACE RAMP === */
  --mg-surface-0: #0F0A1E;    /* Page background — near black with warmth */
  --mg-surface-1: #16102B;    /* Base card surface */
  --mg-surface-2: #1E1636;    /* Elevated card */
  --mg-surface-3: #271D42;    /* Hover/active surface */
  --mg-surface-4: #322550;    /* Border highlight */

  /* === TEXT RAMP === */
  --mg-text-primary:   #F0EDFF;   /* Main content — warm near-white */
  --mg-text-secondary: #9B8FC8;   /* Supporting text */
  --mg-text-tertiary:  #6B5E99;   /* Hints, labels */
  --mg-text-disabled:  #3D3163;   /* Disabled states */

  /* === SEMANTIC === */
  --mg-success:  #22C55E;
  --mg-warning:  #F59E0B;
  --mg-danger:   #EF4444;
  --mg-info:     #3B82F6;

  /* === GAMIFICATION COLORS (from Duolingo research) === */
  --mg-xp:       #FACC15;   /* XP gold */
  --mg-streak:   #F97316;   /* Streak fire orange */
  --mg-level:    #A78BFA;   /* Level badge purple */
  --mg-badge:    #34D399;   /* Achievement badge green */

  /* === SELF-STATE COLORS === */
  --mg-self-sprint:       #FB923C;  /* Orange */
  --mg-self-recovery:     #A78BFA;  /* Soft purple */
  --mg-self-maintenance:  #60A5FA;  /* Cool blue */
  --mg-self-exploration:  #34D399;  /* Teal green */
  --mg-self-survival:     #F87171;  /* Soft red */
  --mg-self-mastery:      #FACC15;  /* Gold */

  /* === LIGHT MODE OVERRIDES (applied via .light-mode class) === */
  --mg-surface-0-light: #F8F7FF;
  --mg-surface-1-light: #FFFFFF;
  --mg-surface-2-light: #F3F0FF;
  --mg-text-primary-light: #1A1040;
  --mg-text-secondary-light: #4B3FA0;
}
```

#### WCAG Contrast Compliance

| Text Color | Background | Ratio | WCAG Level |
|---|---|---|---|
| `--mg-text-primary` (#F0EDFF) | `--mg-surface-0` (#0F0A1E) | 12.4:1 | AAA ✅ |
| `--mg-text-secondary` (#9B8FC8) | `--mg-surface-0` (#0F0A1E) | 5.8:1 | AA ✅ |
| `--mg-text-primary` (#F0EDFF) | `--mg-surface-2` (#1E1636) | 9.1:1 | AAA ✅ |
| `--mg-indigo-500` (#4F35B8) | `--mg-surface-0-light` (#F8F7FF) | 7.2:1 | AAA ✅ |
| `--mg-xp` (#FACC15) | `--mg-surface-1` (#16102B) | 8.3:1 | AAA ✅ |

### 3.3 Typography

```css
/* === FONT STACK === */
--mg-font-display: 'Syne', 'DM Sans', sans-serif;   /* Headlines, feature names */
--mg-font-body: 'DM Sans', 'Inter', sans-serif;      /* Body text, UI labels */
--mg-font-mono: 'JetBrains Mono', monospace;         /* Code, data values */
--mg-font-serif: 'Lora', Georgia, serif;             /* Long-form content, debriefs */

/* === TYPE SCALE === */
--mg-text-xs:   0.75rem;   /* 12px — badges, labels */
--mg-text-sm:   0.875rem;  /* 14px — secondary text, captions */
--mg-text-base: 1rem;      /* 16px — body default */
--mg-text-lg:   1.125rem;  /* 18px — emphasized body */
--mg-text-xl:   1.25rem;   /* 20px — card titles */
--mg-text-2xl:  1.5rem;    /* 24px — section headers */
--mg-text-3xl:  1.875rem;  /* 30px — page titles */
--mg-text-4xl:  2.25rem;   /* 36px — hero numbers (XP, score) */
--mg-text-5xl:  3rem;      /* 48px — splash/hero */

/* === LINE HEIGHT === */
--mg-leading-tight:  1.25;
--mg-leading-normal: 1.5;
--mg-leading-relaxed: 1.7;   /* For counselor chat text */

/* === FONT WEIGHTS === */
--mg-weight-regular: 400;
--mg-weight-medium:  500;
--mg-weight-semibold: 600;
--mg-weight-bold:    700;
```

### 3.4 Spacing System (8px grid)

```css
--mg-space-1:  4px;
--mg-space-2:  8px;
--mg-space-3:  12px;
--mg-space-4:  16px;
--mg-space-5:  20px;
--mg-space-6:  24px;
--mg-space-8:  32px;
--mg-space-10: 40px;
--mg-space-12: 48px;
--mg-space-16: 64px;
--mg-space-20: 80px;
--mg-space-24: 96px;
```

### 3.5 Border Radius

```css
--mg-radius-sm:   4px;    /* Tags, small badges */
--mg-radius-md:   8px;    /* Inputs, small cards */
--mg-radius-lg:   12px;   /* Main cards */
--mg-radius-xl:   16px;   /* Modals, bottom sheets */
--mg-radius-2xl:  24px;   /* Feature panels, hero cards */
--mg-radius-full: 9999px; /* Pills, avatars */
```

### 3.6 Shadow System

```css
/* Depth should feel warm, not harsh. Use sparingly. */
--mg-shadow-sm:  0 1px 3px rgba(10, 0, 30, 0.3);
--mg-shadow-md:  0 4px 12px rgba(10, 0, 30, 0.4);
--mg-shadow-lg:  0 8px 32px rgba(10, 0, 30, 0.5);
--mg-shadow-glow-indigo: 0 0 24px rgba(79, 53, 184, 0.35);  /* For XP gains, achievements */
--mg-shadow-glow-xp:     0 0 16px rgba(250, 204, 21, 0.3);  /* For XP number bursts */
/* Duolingo-inspired tactile button shadow: */
--mg-shadow-button: 0 4px 0 0 rgba(0,0,0,0.35);
```

### 3.7 Animation Tokens

```css
--mg-duration-fast:   100ms;
--mg-duration-normal: 200ms;
--mg-duration-slow:   400ms;
--mg-duration-xslow:  600ms;

--mg-ease-default:  cubic-bezier(0.2, 0, 0, 1);    /* Material-like */
--mg-ease-spring:   cubic-bezier(0.34, 1.56, 0.64, 1); /* Bouncy, for XP pop */
--mg-ease-in:       cubic-bezier(0.4, 0, 1, 1);
--mg-ease-out:      cubic-bezier(0, 0, 0.2, 1);
```

### 3.8 Layout Grid

```css
/* Max widths */
--mg-max-app:     1280px;   /* Outer shell */
--mg-max-content: 720px;    /* Reading column (Notion-inspired) */
--mg-max-chat:    680px;    /* Chat column */

/* Sidebar */
--mg-sidebar-width: 240px;  /* Desktop nav rail */
--mg-sidebar-collapsed: 60px; /* Icon-only mode */

/* Z-index scale */
--mg-z-base:    0;
--mg-z-raised:  10;
--mg-z-overlay: 100;
--mg-z-modal:   200;
--mg-z-toast:   300;
```

### 3.9 Component Design Tokens

#### Buttons
```css
/* Primary CTA */
.btn-primary {
  background: var(--mg-indigo-500);
  color: var(--mg-text-primary);
  border-radius: var(--mg-radius-md);
  padding: var(--mg-space-3) var(--mg-space-6);
  font-weight: var(--mg-weight-semibold);
  box-shadow: var(--mg-shadow-button);
  transition: transform var(--mg-duration-fast) var(--mg-ease-out),
              box-shadow var(--mg-duration-fast) var(--mg-ease-out);
}
.btn-primary:active {
  transform: translateY(2px);
  box-shadow: 0 2px 0 0 rgba(0,0,0,0.35);
}

/* Ghost / Outline */
.btn-ghost {
  background: transparent;
  border: 1px solid var(--mg-surface-4);
  color: var(--mg-text-secondary);
}
```

#### Cards
```css
.card-base {
  background: var(--mg-surface-1);
  border: 1px solid var(--mg-surface-3);
  border-radius: var(--mg-radius-lg);
  padding: var(--mg-space-6);
}
.card-elevated {
  background: var(--mg-surface-2);
  border: 1px solid var(--mg-surface-4);
  box-shadow: var(--mg-shadow-md);
}
```

#### XP Bar (Duolingo-inspired)
```css
.xp-bar {
  height: 12px;
  background: var(--mg-surface-3);
  border-radius: var(--mg-radius-full);
  overflow: hidden;
}
.xp-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--mg-indigo-500), var(--mg-xp));
  border-radius: var(--mg-radius-full);
  transition: width 600ms var(--mg-ease-spring);
}
```

### 3.10 Page Layout Structure

```
┌─────────────────────────────────────────────────┐
│  SIDEBAR (240px)    │   MAIN CONTENT (flex:1)    │
│  ─────────────────  │   ─────────────────────    │
│  Logo               │   ┌──── TOP BAR ────────┐  │
│  ─────────────────  │   │ Season Badge | Self  │  │
│  🏠 Dashboard       │   │ Selector | XP | Burn │  │
│  💬 Chat            │   └────────────────────┘   │
│  🗺️  Journey Map    │                             │
│  📊 Analytics       │   ┌──── PAGE CONTENT ───┐   │
│  🧠 Memory Vault    │   │                     │   │
│  ⚡ Energy Budget   │   │  max-width: 720px   │   │
│  👥 Spaces          │   │  margin: 0 auto     │   │
│  ─────────────────  │   │                     │   │
│  ⚙️  Settings       │   └────────────────────┘   │
│  💎 Upgrade         │                             │
└─────────────────────────────────────────────────┘
```

### 3.11 Tailwind Config Extension

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'mg': {
          'surface-0': '#0F0A1E',
          'surface-1': '#16102B',
          'surface-2': '#1E1636',
          'surface-3': '#271D42',
          'surface-4': '#322550',
          'brand':     '#4F35B8',
          'brand-hover': '#6B52D4',
          'text-primary':   '#F0EDFF',
          'text-secondary': '#9B8FC8',
          'text-tertiary':  '#6B5E99',
          'xp':      '#FACC15',
          'streak':  '#F97316',
          'calm':    '#22C55E',
          'stress':  '#EF4444',
          'recover': '#A78BFA',
          'sprint':  '#FB923C',
        }
      },
      fontFamily: {
        'display': ['Syne', 'sans-serif'],
        'body':    ['DM Sans', 'sans-serif'],
        'mono':    ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        'mg-sm':  '4px',
        'mg-md':  '8px',
        'mg-lg':  '12px',
        'mg-xl':  '16px',
        'mg-2xl': '24px',
      },
      boxShadow: {
        'mg-button': '0 4px 0 0 rgba(0,0,0,0.35)',
        'mg-glow':   '0 0 24px rgba(79, 53, 184, 0.35)',
        'mg-xp':     '0 0 16px rgba(250, 204, 21, 0.3)',
      },
      animation: {
        'xp-burst': 'xpBurst 600ms cubic-bezier(0.34,1.56,0.64,1)',
        'fade-up':  'fadeUp 300ms cubic-bezier(0,0,0.2,1)',
      }
    }
  }
};
```

---

## 4. GEMINI 1.5 FLASH PROMPT LIBRARY

> All prompts use `gemini-1.5-flash`.
> All prompts return structured JSON for deterministic parsing.
> Error handling: always wrap in try/catch, validate JSON schema before use.

### 4.1 Memory Extraction Prompt (F01)

**When called**: After each session ends (post-session background job)
**Input**: Last session's messages array

```javascript
// server/services/memoryService.js

const MEMORY_EXTRACTION_PROMPT = (messages) => `
You are a memory extraction system for a personal growth AI app.
Analyze this conversation and extract structured memories about the user.

CONVERSATION:
${messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n')}

Extract up to 6 memories. Output ONLY valid JSON, no other text, no markdown.

Schema:
{
  "memories": [
    {
      "type": "fact|goal|emotion_pattern|milestone|preference",
      "content": "Single sentence. Present tense. About the user, not the conversation.",
      "confidence": 0.0-1.0,
      "tags": ["max", "3", "tags"]
    }
  ]
}

Rules:
- type=fact: stable personal information (name, job, location, background)
- type=goal: something they want to achieve
- type=emotion_pattern: recurring emotional behavior ("user becomes anxious before deadlines")
- type=milestone: something they achieved or completed
- type=preference: how they like to work/learn/interact
- confidence reflects how explicitly the user stated this (1.0=direct statement, 0.5=implied)
- content must be about the USER, written as a third-person fact
- Skip anything uncertain, sensitive, or too vague
- Maximum 6 memories per session
`;
```

### 4.2 Burnout Score Analysis Prompt (F02) [x]

**When called**: Weekly, inside insights CRON

```javascript
const BURNOUT_ANALYSIS_PROMPT = (userData) => `
You are a wellness analysis system. Analyze this user's behavioral data and produce a burnout assessment.

USER DATA (last 7 days):
- Sessions completed: ${userData.sessionCount}
- Average sessions per week (historical): ${userData.avgSessions}
- Dominant emotions: ${userData.topEmotions.join(', ')}
- Stress scores (1-10): ${userData.stressScores.join(', ')}
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

Scoring guide: 0-30=healthy, 31-60=watch, 61-80=concerning, 81-100=critical.
Never use clinical language. Be warm, observational, not prescriptive.
Output ONLY JSON.
`;
```

### 4.3 Session Debrief Prompt (F05)

**When called**: On demand, when user clicks "Wrap Session"

```javascript
const SESSION_DEBRIEF_PROMPT = (messages, emotionData) => `
You are a session debrief writer for a personal growth AI app.
Create a concise, warm, useful session summary.

CONVERSATION (last session):
${messages.slice(-20).map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n')}

EMOTION DATA: ${JSON.stringify(emotionData)}

Output ONLY valid JSON:
{
  "summary": "2-3 sentences. What the user focused on and what was explored.",
  "emotionalArc": "One sentence. How the emotional energy shifted. E.g. 'Started uncertain, ended with clarity'",
  "keyInsights": ["insight 1", "insight 2", "insight 3"],
  "nextAction": "One specific, concrete action for the user to take in the next 24 hours.",
  "counselorQuote": "A 1-sentence reflection the counselor would say to close the session. Warm, direct, personal."
}

Tone: Warm, honest, brief. The user reads this immediately after their session.
Output ONLY JSON.
`;
```

### 4.4 Life Season Detection Prompt (F12)

**When called**: Weekly, in insights CRON

```javascript
const SEASON_DETECTION_PROMPT = (userData, recentMessages) => `
You are a behavioral pattern analyzer for a personal growth app.
Detect this user's current life season based on their behavior and recent conversations.

BEHAVIORAL DATA:
- Sessions this week: ${userData.sessionsThisWeek}
- Streak: ${userData.streak}
- Burnout score: ${userData.burnoutScore}
- XP velocity (vs last week): ${userData.xpChange}%
- Goals completed (vs last week): ${userData.completionChange}%
- Has had a lapse recently: ${userData.hadRecentLapse}

RECENT CONVERSATION TOPICS (from last 5 sessions):
${recentMessages.map(m => m.content).slice(0, 10).join('\n').substring(0, 1000)}

Output ONLY valid JSON:
{
  "season": "survival|rebuilding|exploration|sprint|mastery|transition|maintenance",
  "confidence": 0.0-1.0,
  "seasonReason": "One sentence explaining why this season was detected",
  "adjustments": {
    "counselorTone": "Brief tone guidance for counselor system prompt",
    "dailyGoalModifier": -2 to +2,
    "messageToUser": "A 1-2 sentence message to show the user when they enter this season"
  }
}
Output ONLY JSON.
`;
```

### 4.5 Identity Drift Detection Prompt (F15)

**When called**: Weekly, in insights CRON

```javascript
const IDENTITY_DRIFT_PROMPT = (identityStatements, behaviorSummary) => `
You are a behavioral alignment analyzer for a personal growth app.
Assess how well the user's actual behavior aligns with their stated identity.

STATED IDENTITY (what user says they want to be):
${identityStatements.map(s => `- "${s.statement}"`).join('\n')}

ACTUAL BEHAVIOR (last 30 days):
${JSON.stringify(behaviorSummary)}

Output ONLY valid JSON:
{
  "driftScore": 0-100,
  "alignmentSummary": "1-2 sentences. Honest but compassionate. Not accusatory.",
  "strongestDriftArea": "The single biggest gap between stated identity and behavior",
  "alignmentWin": "One thing where behavior actually matches their stated identity",
  "counselorHint": "What the counselor should gently mention in the next session. Max 1 sentence."
}

driftScore guide: 0-25=well aligned, 26-50=minor drift, 51-75=notable gap, 76-100=significant misalignment.
Tone: A wise, caring friend. Not a judge. Not a therapist.
Output ONLY JSON.
`;
```

### 4.6 Friction Pattern Analysis Prompt (F14)

**When called**: Weekly, on sufficient friction event data (>20 events)

```javascript
const FRICTION_ANALYSIS_PROMPT = (frictionEvents) => `
You are a behavioral friction analyst. Identify psychological resistance patterns from user behavior data.

FRICTION EVENTS (last 30 days):
${JSON.stringify(frictionEvents.slice(0, 50))}

Output ONLY valid JSON:
{
  "frictionZones": [
    {
      "zone": "Short label for this friction pattern",
      "description": "1 sentence describing the behavior pattern",
      "frequency": "daily|weekly|occasional",
      "context": "When/where this friction typically appears",
      "severity": "low|medium|high"
    }
  ],
  "topFrictionZone": "Name of the single most significant friction zone",
  "counselorApproach": "How the counselor should address the top friction zone. 1-2 sentences. Gentle, non-confrontational."
}

Maximum 3 friction zones. Focus on patterns, not individual events.
Output ONLY JSON.
`;
```

### 4.7 Parallel Self Configuration Prompt (F08)

**When called**: When user creates or edits a SelfState

```javascript
const SELF_STATE_PROMPT = (selfName, selfType, userHistory) => `
You are configuring a "Self State" for a user's personal growth profile.
Based on the self type and user history, suggest optimal configuration.

SELF NAME: ${selfName}
SELF TYPE: ${selfType}
USER HISTORY SUMMARY: Sessions/week avg: ${userHistory.avgSessions}, Typical stress level: ${userHistory.avgStress}, Goals typically completed: ${userHistory.completionRate}%

Output ONLY valid JSON:
{
  "suggestedConfig": {
    "xpMultiplier": 0.5-2.0,
    "dailyGoalCount": 1-5,
    "checkInFrequency": "gentle|normal|aggressive",
    "counselorTone": "Brief tone description for system prompt",
    "maxDailyEnergy": 40-120,
    "allowedTracks": ["learning", "career", "wellness", "all"]
  },
  "activationMessage": "What the counselor says when this self is activated. Warm, brief, motivating.",
  "deactivationMessage": "What the counselor says when switching away from this self.",
  "colorHex": "Suggested hex color for this self's UI identity"
}
Output ONLY JSON.
`;
```

### 4.8 Enhanced Chat System Prompt (Integrated)

**When called**: Every chat request (modified getSystemPrompt)

```javascript
// server/controllers/chatControllers.js
const getSystemPrompt = async (userId, counsellorType, currentEmotion) => {
  const [memories, selfState, season, identityDrift, energyLevel] = await Promise.all([
    memoryService.injectMemories(userId),
    selfStateService.getSelfStateContext(userId),
    seasonService.getCurrentSeason(userId),
    identityService.getDriftHint(userId),
    energyService.getCurrentLevel(userId)
  ]);

  return `
You are ${PERSONA_DEFINITIONS[counsellorType].name}, an AI mentor on Mind-Guide.

${PERSONA_DEFINITIONS[counsellorType].basePrompt}

CONTEXT ABOUT THIS USER:
${memories ? `WHAT YOU REMEMBER:\n${memories}` : ''}
${selfState ? `CURRENT SELF STATE: ${selfState}` : ''}
${season ? `LIFE SEASON: User is in a "${season.season}" season. ${season.adjustments.counselorTone}` : ''}
${identityDrift?.counselorHint ? `GENTLE NOTE: ${identityDrift.counselorHint}` : ''}
${energyLevel ? `ENERGY LEVEL TODAY: ${energyLevel} — adjust workload suggestions accordingly` : ''}

CURRENT EMOTIONAL STATE: ${currentEmotion}

RESPONSE RULES:
1. Never use bullet points. Speak in natural prose paragraphs.
2. Use natural conversational fillers ("honestly," "I think," "here's what I'd say").
3. Always end your response with [[STRESS_LEVEL: X]] where X is 1-10.
4. Be warm, direct, and specific to this user. Reference what you know about them.
5. Keep responses under 150 words unless the user asks a complex question.
6. Never start with "I" — vary your openings.
`;
};
```

---

## 5. STRIPE PAYMENT INTEGRATION PLAN

### 5.1 Pricing Structure

| Tier | Price | Features |
|---|---|---|
| **Free** | $0/mo | 2 self-states, basic personas, 1 contract, weekly report |
| **Pro** | $12/mo or $99/yr | All 17 features, 5 premium personas, unlimited memory, full analytics |
| **Enterprise** | $18/seat/mo (min 10 seats) | Team dashboard, custom personas, admin controls, SSO |

### 5.2 Backend Implementation

```
npm install stripe
```

**New file**: `server/services/stripeService.js`

```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// 1. CREATE CHECKOUT SESSION
async function createCheckoutSession(userId, priceId, email) {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'subscription',
    customer_email: email,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.CLIENT_URL}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.CLIENT_URL}/upgrade/cancel`,
    metadata: { userId },
    subscription_data: { trial_period_days: 7 }
  });
  return session;
}

// 2. HANDLE WEBHOOK
async function handleWebhook(event) {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const userId = session.metadata.userId;
      await User.findByIdAndUpdate(userId, {
        subscriptionTier: 'pro',
        subscriptionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        stripeCustomerId: session.customer,
        stripeSubscriptionId: session.subscription
      });
      break;
    }
    case 'customer.subscription.deleted': {
      await User.findOneAndUpdate(
        { stripeSubscriptionId: event.data.object.id },
        { subscriptionTier: 'free', subscriptionExpiry: null }
      );
      break;
    }
    case 'invoice.payment_failed': {
      // Send payment failure email via Nodemailer
      break;
    }
  }
}

// 3. CREATE CUSTOMER PORTAL
async function createPortalSession(stripeCustomerId) {
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${process.env.CLIENT_URL}/settings`
  });
  return session.url;
}
```

**New Routes** (`server/routes/paymentRoutes.js`):
```javascript
router.post('/create-checkout',       Shield, createCheckoutSession);
router.post('/webhook',               express.raw({type:'application/json'}), handleStripeWebhook);
router.get('/portal',                 Shield, createPortalPortal);
router.get('/subscription-status',   Shield, getSubscriptionStatus);
```

### 5.3 Frontend Implementation

**New file**: `client/src/pages/Upgrade.jsx`

```jsx
// Pricing page with 3 tiers
// Free / Pro / Enterprise cards
// Stripe Checkout redirect on CTA click
// 7-day trial badge prominently displayed
```

**New file**: `client/src/components/PaywallGate.jsx`

```jsx
// Wrapper component that checks user.subscriptionTier
// If feature requires pro and user is free: show upgrade modal
// Usage: <PaywallGate requiredTier="pro"><PremiumFeature /></PaywallGate>
```

**Upgrade flow locations**:
- Memory Vault sidebar item → upgrade modal on free click
- Premium persona in selector → lock icon + upgrade CTA
- Session debrief share button → upgrade modal
- Energy budget advanced view → upgrade modal
- Contract creation (2nd contract) → upgrade modal

### 5.4 Stripe Price IDs (set in .env)

```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_MONTHLY_PRICE_ID=price_...
STRIPE_PRO_YEARLY_PRICE_ID=price_...
STRIPE_ENTERPRISE_PRICE_ID=price_...
```

---

## 6. PHASED IMPLEMENTATION ROADMAP

---

### PHASE 1 — Foundation & First Revenue (Weeks 1–8)
**Goal**: Prove willingness to pay. Ship 5 features. Get first $1,000 MRR.

#### Week 1–2: Payment Infrastructure + Premium Personas (F06)
- [x] Add `subscriptionTier`, `stripeCustomerId`, `stripeSubscriptionId` to User model
- [x] Implement `stripeService.js` with checkout, webhook, portal
- [x] Write 3 premium persona system prompts (Senior Engineer, Therapy-Inspired, Startup Founder)
- [x] Gate premium counselors behind Pro check in `chatControllers.js`
- [x] Build `Upgrade.jsx` pricing page (3 tiers, 7-day trial CTA)
- [x] Build `PaywallGate.jsx` component
- [ ] Set up Stripe webhook endpoint and test with Stripe CLI

#### Week 3: Session Debrief MVP (F05)
- [x] Add `sessionDebriefs` array to Insight model
- [x] Create `POST /insights/debrief` endpoint using Session Debrief Prompt (§4.3)
- [x] Add "Wrap Session" button to `ChatApp.jsx` (shows after 8+ messages)
- [x] Display debrief inline in chat as a styled card
- [ ] Add share token generation (Pro tier only)

#### Week 4: Goal Commitment Contracts MVP (F03)
- [x] Create Contract model
- [x] Build `contractService.js` with `createContract()` and `processCheckIns()`
- [x] Add CRON job for daily check-in emails
- [x] Add "Commit to Level" button on Journey Map level cards
- [ ] Build commitment deadline picker modal

#### Week 5: Reverse Streaks (F09)
- [x] Add `recoveryScore`, `recoveryEvents`, `longestRecovery` to User model
- [x] Update `gamificationService.js` with recovery detection logic
- [ ] Replace "Streak Lost" toast with "Recovery Mode" notification
- [x] Add Recovery Score widget to Dashboard
- [ ] Ensure `awardXP()` is still used for all XP changes (per existing convention)

#### Week 6–7: Burnout Score MVP (F02)
- [x] Add `burnoutScore`, `burnoutTrend`, `energyLevel` to Insight model
- [x] Create `burnoutService.js` with scoring algorithm
- [ ] Integrate with existing weekly CRON job
- [x] Add Wellness Gauge to Dashboard
- [ ] Add one sentence to Weekly Insight email: "Your energy level this week: [High/Medium/Low]"

#### Week 8: Phase 1 Cleanup & Launch
- [ ] Integration testing: full payment flow (checkout → webhook → Pro unlock)
- [ ] Paywall gate audit: ensure all Pro features properly gated
- [ ] Performance check: new DB indexes added for Memory and Contract collections
- [ ] Soft launch to beta users, collect feedback

---

### PHASE 2 — Retention & Deepening (Weeks 9–20)
**Goal**: Reduce churn. Build the moat. Hit $5K MRR.

#### Weeks 9–11: Persistent Counselor Memory (F01)
- [x] Create `Memory` model with indexes
- [x] Build `memoryService.js` for extraction and injection logicnforce, deactivate)
- [ ] Modify `getSystemPrompt()` to inject memories
- [x] Hook into session wrap button logic to trigger extraction
- [x] Build Memory Vault page (`/vault`)
- [x] Add memory correction/deactivation UI

#### Weeks 12–13: Adaptive Assessment + Spaced Repetition (F04)
- [ ] Add `assessmentHistory` array to User model
- [ ] Modify assessment generation to accept difficulty parameter
- [ ] Implement `getAdaptiveDifficulty()` in journeyService
- [ ] Implement `getReviewQueue()` with SR scheduling
- [ ] Add "Review Queue" section to Journey Map
- [ ] Connect burnout score to difficulty cap logic

#### Week 14: Momentum Insurance (F17)
- [ ] Create MomentumInsurance model
- [ ] Build insurance creation UI in Settings
- [ ] Add trigger check to daily CRON
- [ ] Create template library (Finals Week, Travel Mode, New Job)
- [ ] Implement auto-activation with counselor notification

#### Weeks 15–16: Parallel Selves System (F08)
- [ ] Create SelfState model
- [ ] Build `selfStateService.js`
- [x] Build "Statement Builder" UI on Profile page
- [x] Pass these statements into the AI system prompt contexts via `getSystemPrompt()`
- [ ] Build Self creation/edit flow with AI config suggestion (§4.7)
- [ ] Implement per-self XP multiplier in `gamificationService.js`

#### Weeks 17–18: Life Seasons Engine (F12)
- [ ] Add `currentSeason`, `seasonHistory` to User model
- [ ] Build `seasonService.js` with detection logic + Gemini prompt (§4.4)
- [ ] Add to weekly CRON
- [ ] Integrate season adjustments into Journey Map sorting
- [ ] Add season badge to Dashboard header
- [ ] Update Weekly Insight email with season context

#### Weeks 19–20: Identity Drift Detection (F15) + Energy Budgeting MVP (F10)
- [x] Add `identityStatements` field to User model
- [ ] Build identity extraction from onboarding/chat history
- [ ] Implement `identityDriftService.js` with Claude prompt (§4.5)
- [ ] Create Energy Profile model and basic daily tracking
- [ ] Add Energy Bar to Dashboard
- [ ] Connect energy to Self State config

---

### PHASE 3 — Enterprise & Premium Depth (Month 6+)
**Goal**: Unlock enterprise contracts. Establish category leadership.

#### Month 6–7: B2B Team Dashboard (F07)
- [ ] Create Organization model
- [ ] Add `organizationId`, `dataSharedWithOrg`, `orgRole` to User model
- [ ] Build org invite and onboarding flow
- [ ] Build admin-only `/admin` route and Team Dashboard
- [ ] Implement aggregated burnout heatmap (minimum 5 users, GDPR-compliant)
- [ ] Privacy-first: explicit consent modal for all data sharing
- [ ] Enterprise Stripe pricing and seat-based billing

#### Month 7–8: Friction Mapping (F14) + Adaptive Environment (F16)
- [ ] Create FrictionEvent model and client-side event tracking
- [ ] Build `frictionService.js` with Gemini analysis prompt (§4.6)
- [ ] Build Friction Map visualization on Analytics page
- [ ] Implement behavioral profiling for Adaptive Environment
- [ ] Build 4 UX archetypes with distinct interaction patterns
- [ ] Add profile override in Pro settings

#### Month 8–9: Social Gravity / Momentum Spaces (F13)
- [ ] Create MomentumSpace model
- [ ] Build Space creation, invite, and join flow
- [ ] Implement gravitational pull calculation
- [ ] Build Space page with momentum visualization
- [ ] Add group XP multiplier to `gamificationService.js`
- [ ] Build weekly Space Highlights email

#### Month 9–10: Personal Economy System (F11)
- [ ] Add economy fields to User model
- [ ] Build `economyService.js` with all earning/multiplier rules
- [ ] Build Economy Dashboard widget
- [ ] Implement Focus Capital unlockables (cosmetics, avatar frames)
- [ ] Connect economy to all existing gamification touchpoints

---

## 7. GIT COMMIT STRATEGY & BRANCH ARCHITECTURE

### 7.1 Branch Model

```
main          ← Production-ready code only. Protected branch.
develop       ← Integration branch. All features merge here first.
release/x.x   ← Release candidate branches (cut from develop)

feature/F01-counselor-memory
feature/F02-burnout-score
feature/F03-commitment-contracts
feature/F04-adaptive-assessment
feature/F05-session-debrief
feature/F06-premium-personas
feature/F07-b2b-dashboard
feature/F08-parallel-selves
feature/F09-reverse-streaks
feature/F10-energy-budgeting
feature/F11-personal-economy
feature/F12-life-seasons
feature/F13-social-gravity
feature/F14-friction-mapping
feature/F15-identity-drift
feature/F16-adaptive-environment
feature/F17-momentum-insurance
feature/payment-stripe-integration
feature/design-system-tokens
hotfix/*      ← Emergency production fixes
```

### 7.2 Commit Message Convention

```
Format: <type>(<scope>): <subject>

Types:
  feat     → New feature
  fix      → Bug fix
  schema   → Database model change
  prompt   → Claude/AI prompt change
  style    → CSS/design token change
  refactor → Code restructure (no behavior change)
  test     → Test additions
  docs     → Documentation
  perf     → Performance improvement
  chore    → Config, dependencies, build

Scope: the feature ID or system area
  F01, F02 ... F17 (feature IDs)
  auth, chat, gamification, journey, insights, payment, design

Examples:
  feat(F09): add recoveryScore field to User model
  schema(F09): add recoveryEvents array with compound index
  feat(F09): implement recovery detection in gamificationService
  fix(F02): clamp burnout score to 0-100 before DB write
  prompt(F05): refine session debrief JSON schema for consistency
  style(design): add SelfState color tokens to CSS variables
  feat(payment): implement Stripe checkout session creation
  chore(deps): add stripe@14.x to server package.json
```

### 7.3 Phase 1 Git Commit Sequence

```bash
# === PAYMENT + PREMIUM PERSONAS ===
git checkout -b feature/payment-stripe-integration
git commit -m "chore(deps): add stripe@14 and @stripe/stripe-js to server/client"
git commit -m "schema(F06): add subscriptionTier, stripeCustomerId fields to User model"
git commit -m "feat(payment): implement stripeService with checkout, webhook, portal"
git commit -m "feat(payment): add /payment routes for checkout, webhook, portal"
git commit -m "feat(F06): write Senior Engineer premium persona system prompt"
git commit -m "feat(F06): write Therapy-Inspired premium persona system prompt"
git commit -m "feat(F06): write Startup Founder premium persona system prompt"
git commit -m "feat(F06): gate premium counselors behind subscriptionTier check"
git commit -m "feat(payment): build Upgrade.jsx pricing page with 3 tiers"
git commit -m "feat(payment): build PaywallGate.jsx component for feature gating"
git commit -m "test(payment): verify Stripe webhook flow with Stripe CLI"

# === SESSION DEBRIEF ===
git checkout -b feature/F05-session-debrief
git commit -m "schema(F05): add sessionDebriefs array and shareToken to Insight model"
git commit -m "prompt(F05): write SESSION_DEBRIEF_PROMPT for Claude API"
git commit -m "feat(F05): implement POST /insights/debrief controller"
git commit -m "feat(F05): add WrapSession button to ChatApp.jsx (triggers at 8+ msgs)"
git commit -m "feat(F05): build SessionDebrief display card component"
git commit -m "feat(F05): implement share token generation (Pro tier gate)"

# === COMMITMENT CONTRACTS ===
git checkout -b feature/F03-commitment-contracts
git commit -m "schema(F03): create Contract model with indexes"
git commit -m "feat(F03): implement contractService.createContract and processCheckIns"
git commit -m "feat(F03): add contract check-in processing to weekly CRON"
git commit -m "feat(F03): build CommitButton component for Journey level cards"
git commit -m "feat(F03): build CommitmentModal with deadline picker"
git commit -m "feat(F03): add Commitments tab to Dashboard"

# === REVERSE STREAKS ===
git checkout -b feature/F09-reverse-streaks
git commit -m "schema(F09): add recoveryScore and recoveryEvents to User model"
git commit -m "feat(F09): implement recovery detection logic in gamificationService"
git commit -m "feat(F09): replace streak-lost toast with recovery mode notification"
git commit -m "feat(F09): add RecoveryScore widget to Dashboard"
git commit -m "style(F09): add recovery animation and color tokens"

# === BURNOUT SCORE ===
git checkout -b feature/F02-burnout-score
git commit -m "schema(F02): add burnoutScore, burnoutTrend, energyLevel to Insight model"
git commit -m "feat(F02): implement burnoutService.computeForUser scoring algorithm"
git commit -m "prompt(F02): write BURNOUT_ANALYSIS_PROMPT for Claude API"
git commit -m "feat(F02): integrate burnout computation into weekly insights CRON"
git commit -m "feat(F02): build WellnessGauge component for Dashboard"
git commit -m "feat(F02): add energy level line to Weekly Insight email template"

# === PHASE 1 RELEASE ===
git checkout develop
git merge feature/payment-stripe-integration
git merge feature/F05-session-debrief
git merge feature/F03-commitment-contracts
git merge feature/F09-reverse-streaks
git merge feature/F02-burnout-score
git checkout -b release/1.1.0
# → QA testing, fix hotfixes on release branch
git checkout main
git merge release/1.1.0
git tag v1.1.0
```

### 7.4 PR Template

```markdown
## Feature
<!-- Feature ID and name -->

## What this PR does
<!-- 2-3 sentence summary -->

## DB changes
- [ ] No schema changes
- [ ] Schema changes included (migration notes below)
- [ ] New indexes added

## Prompt changes
- [ ] No AI prompt changes
- [ ] Prompt updated — tested for JSON schema compliance

## Paywall check
- [ ] Feature properly gated (Pro/Enterprise)
- [ ] PaywallGate component used where needed
- [ ] Free tier still gets appropriate baseline access

## Checklist
- [ ] awardXP() used for all XP changes (never manual)
- [ ] addUser() called after profile modifications
- [ ] New routes added to route file
- [ ] New env vars added to .env.example
- [ ] No CommonJS/ESM boundary violations
```

---

## 8. DATABASE SCHEMA EVOLUTION MAP

### 8.1 Phase 1 Changes

```
User model additions:
+ subscriptionTier:       String ['free','pro','enterprise'] (default:'free')
+ subscriptionExpiry:     Date
+ stripeCustomerId:       String
+ stripeSubscriptionId:   String
+ recoveryScore:          Number (default:0)
+ recoveryEvents:         Array [{lapseDate, returnDate, daysOut, recoveryXP}]
+ longestRecovery:        Number
+ totalCollapses:         Number

Insight model additions:
+ burnoutScore:           Number
+ burnoutTrend:           String ['stable','rising','critical']
+ energyLevel:            String ['high','medium','low']
+ sessionDebriefs:        Array [{sessionDate, summary, emotionalArc, keyInsights, nextAction, xpEarned, shareToken, shareExpiry}]

New collections:
+ Contract: {userId, journeyTrackId, levelId, commitmentDeadline, checkInFrequency, checkInDates, status, remindersSent, completedAt}

New indexes:
+ Contract: { userId: 1, status: 1 }
+ Contract: { checkInDates: 1 }
```

### 8.2 Phase 2 Changes

```
User model additions:
+ assessmentHistory:      Array [{levelId, attemptDate, score, difficulty, passed, wrongQuestions}]
+ activeSelfStateId:      ObjectId ref:SelfState
+ selfStates:             Array [ObjectId]
+ currentSeason:          String ['survival','rebuilding','exploration','sprint','mastery','transition','maintenance']
+ seasonHistory:          Array [{season, startDate, endDate, notes}]
+ identityStatements:     Array [{statement, capturedAt, extractedFrom}]

New collections:
+ Memory: {userId, type, content, confidence, sourceSessionId, tags, isActive, lastReinforcedAt}
+ SelfState: {userId, name, emoji, type, isActive, config: {xpMultiplier, dailyGoalCount, checkInFrequency, counselorTone, maxDailyEnergy}, activatedAt, sessionCount}
+ MomentumInsurance: {userId, name, triggerConditions, emergencyRoutine, isActive, lastActivated}
+ EnergyProfile: {userId, dailyBudget, activities, dailyLog, avgEnergyPerDay, overbudgetDays}

New indexes:
+ Memory: { userId: 1, type: 1, confidence: -1 }
+ Memory: { userId: 1, isActive: 1 }
+ SelfState: { userId: 1, isActive: 1 }
```

### 8.3 Phase 3 Changes

```
User model additions:
+ organizationId:         ObjectId ref:Organization
+ dataSharedWithOrg:      Boolean (default:false)
+ orgRole:                String ['member','admin']
+ economy: {focusCapital, earningMultiplier, momentumDebt, weeklyEarnings, lifetimeCapital}
+ adaptiveProfile: {pressureResponse, competitionAffinity, sustainabilityNeed, autonomyPreference, lastProfiledAt}

New collections:
+ Organization: {name, adminUserId, memberIds, plan, seatsAllowed, dataConsentVersion}
+ MomentumSpace: {name, creatorId, members, groupMomentum, weeklyActivity, spaceType, isPrivate, inviteCode, maxMembers}
+ FrictionEvent: {userId, eventType, context, timestamp, metadata}
```

---

## 9. ENVIRONMENT & CONFIG REFERENCE

```bash
# server/.env (complete reference for all phases)

# Core
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=...
CLIENT_URL=http://localhost:5173

# AI Models
GEMINI_API_KEY=...
ANTHROPIC_API_KEY=...       # NEW: for Claude API calls (memory, burnout, etc.)
HF_API_KEY=...              # Hugging Face (existing)
ELEVENLABS_API_KEY=...      # Existing

# Premium Persona Voice IDs (ElevenLabs)
VOICE_SENIOR_ENGINEER=...
VOICE_THERAPY_INSPIRED=...
VOICE_STARTUP_FOUNDER=...
VOICE_LANGUAGE_COACH=...
VOICE_BURNOUT_RECOVERY=...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_MONTHLY_PRICE_ID=price_...
STRIPE_PRO_YEARLY_PRICE_ID=price_...
STRIPE_ENTERPRISE_PRICE_ID=price_...

# Email
NODEMAILER_HOST=smtp.gmail.com
NODEMAILER_PORT=587
NODEMAILER_USER=...
NODEMAILER_PASS=...

# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

---

## APPENDIX: COMPETITIVE WHITE SPACE SUMMARY

```
What exists today (2026 landscape):
  Khanmigo:    AI tutoring — no memory, no emotion, no gamification
  Duolingo:    Gamification mastery — no mentorship, language-only, no emotion
  Woebot:      Emotional support — no learning, no goals, no progress
  Headspace:   Mindfulness — passive consumption, no personalization depth
  Notion AI:   Knowledge — no coaching, no accountability, no emotion
  Linear:      Productivity — no emotional layer, developer-only

What Mind-Guide uniquely combines:
  ✅ Emotional awareness (stress, burnout) — like Woebot
  ✅ Personalized roadmaps (goals, tracks) — like Khanmigo
  ✅ Gamified progress (XP, streaks) — like Duolingo
  ✅ Behavioral mechanics (seasons, selves) — NOBODY does this
  ✅ Persistent relationship memory — NOBODY does this
  ✅ Resilience-first mechanics — NOBODY does this

The category: Personal Growth OS
The moat: Accumulated relationship context + behavioral adaptation
The pitch: "An app that adapts to who you are, not who you should be."
```

---

*Mind-Guide Master Plan v1.0 — Generated for the development team.*
*Update this document on every schema change, prompt update, or feature revision.*
*This document is the single source of truth for product decisions.*
