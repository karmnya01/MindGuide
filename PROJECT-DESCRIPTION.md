# Mind-Guide — Project Description Document

> Use this file for project reports, presentations, or AI assistants (e.g. Gemini).  
> Last updated from codebase: May 2026.

---

## 1. Overview

| Field | Detail |
|-------|--------|
| **Name** | Mind-Guide |
| **Type** | AI-native SaaS web application |
| **Category** | Personal Growth Operating System |
| **Tagline** | AI Study Guide & Emotional Mentor |
| **Stack** | MERN (MongoDB, Express, React, Node.js) |

**Summary:** Mind-Guide bridges learning and mentorship. Users chat with specialized AI counselors, receive structured roadmaps and session reports, track emotions and stress, earn XP through gamified journey levels, and can join collaborative study rooms. Pro features are unlocked via Stripe subscriptions.

**Target users:** Students, self-learners, career switchers, professionals seeking career/financial/wellness guidance.

**Problem solved:** Most apps offer only tutoring, wellness, or gamification in isolation. Mind-Guide combines emotional awareness, personalized roadmaps, gamified progress, and persistent AI memory in one platform.

---

## 2. Core Pillars

1. **Emotional awareness** — Real-time emotion detection, stress scoring, burnout signals, mood charts.
2. **Personalized roadmaps** — AI-generated goals from chat, visualized and synced to journey levels.
3. **Gamified progress** — XP, levels, streaks, badges, recovery score, level unlocks with quizzes.
4. **Behavioral adaptation** — Persistent memories, self-state, identity statements, goal contracts.

---

## 3. Technology Stack

### Frontend (`client/`)
- React 18 + Vite
- React Router v6, Redux Toolkit + redux-persist
- Tailwind CSS, Framer Motion
- Chart.js, Mermaid.js, react-markdown
- Axios (API base: `http://localhost:3005`)
- Clerk React + JWT cookies
- Socket.io client, ElevenLabs + Web Speech API

### Backend (`server/`)
- Node.js + Express (port **3005**)
- MongoDB + Mongoose
- Auth: JWT cookies + Clerk OAuth
- **Groq** (`llama-3.3-70b-versatile`) — primary AI (chat, roadmaps, insights, memory, quizzes, reports)
- **Google Gemini 2.0 Flash** — skill extraction from roadmap goals only
- **Hugging Face** — emotion classification (`j-hartmann/emotion-english-distilroberta-base`)
- **ElevenLabs** — text-to-speech
- Stripe, Nodemailer, node-cron, PDFKit, json2csv, Socket.io

---

## 4. Architecture

```
Browser (React)  ←→  REST API (/api/v1/*)  ←→  Controllers  ←→  Services  ←→  MongoDB
                 ←→  Socket.io (study rooms)
```

**Folders:**
- `client/src/pages` — Home, ChatApp, Counselors, Dashboard, JourneyMap, StudyRooms, Upgrade
- `client/src/components` — Layout, ReportModal, chat UI, dashboard widgets
- `server/controllers` — Request handling & AI orchestration
- `server/services` — Business logic (gamification, memory, insights, journey, stripe, cron)
- `server/model` — Database schemas
- `server/routes` — API endpoints
- `server/socket` — Real-time study room events
- `server/reports` — Generated PDF/CSV files

---

## 5. Features

### 5.1 AI Counselors
- **Free counselors:** Academic, Career, Personal, Financial, Health & Wellness, Student Life, Emotional Support, General, Technical, etc.
- **Pro counselors:** Senior Engineer, Therapy-Inspired, Startup Founder
- Each persona has a name, expert system prompt, and optional custom voice.
- Responses use domain-specific templates (financial, emotional, academic, career) with structured sections.
- Every reply ends with `[[STRESS_LEVEL: 1-10]]` for analytics.

### 5.2 Chat System
**Flow:** User message → Hugging Face emotion → save to DB → Groq reply → parse stress tag → save reply → award 10 XP + update streak.

**Client features:** Markdown replies, stress chart, emotion indicators, speech-to-text, TTS (English/Hindi), session report generation, roadmap preview.

**API:** `GET/POST /api/v1/chat`, `/analyze-tone`, `/personality`, `/tts`, `/report`, `/roadmap`

### 5.3 Roadmaps & Journey
- Roadmap generated as JSON from chat (goals, timeline, resource links).
- Roadmap goals converted to **Journey** tracks with locked/unlocked/completed levels.
- **Assessment:** AI generates 3 MCQs per level; 60% required to pass.
- Pass → XP + unlock next level; fail → XP deduction.

### 5.4 Memory Vault
- After sessions, AI extracts facts, goals, emotion patterns, milestones, preferences.
- Top memories injected into future counselor prompts.
- Users view/delete memories in Dashboard → Vault.

### 5.5 Reports
- Deep session analysis (SWOT, debrief, self-state) via Groq.
- Exports **PDF** and **CSV** stored on server; listed in Dashboard → Reports.

### 5.6 Weekly Insights
- Cron job (Wednesday UTC) batches users, aggregates week activity, generates insight JSON, emails summary.
- Pro users can trigger insights and session debriefs manually.

### 5.7 Gamification
- **XP / Level:** `level = floor(sqrt(xp / 50))` (e.g. 50, 200, 450, 800 XP thresholds).
- **Streaks:** UTC day-based; broken streaks add recovery score.
- **Badges:** First session, 7-day streak, roadmap complete, 100/500 XP.

### 5.8 Goal Contracts
- Users commit to goals with deadlines and check-ins.
- Free: 1 active contract; Pro: unlimited.
- XP rewards/penalties on completion/failure.

### 5.9 Study Rooms
- Create/join rooms by category (DSA, Web Dev, AI/ML, etc.).
- Real-time chat, focus timers, presence, reactions via Socket.io.

### 5.10 Subscriptions (Stripe)
- Tiers: `free`, `pro`, `enterprise`
- Checkout, webhooks, customer portal
- Gates premium personas, insights/debriefs, unlimited contracts

### 5.11 Dashboard
| Route | Feature |
|-------|---------|
| `/account/dashboard` | Stats overview |
| `.../reports` | Download past reports |
| `.../profile` | Profile settings |
| `.../journey` | Journey map & quizzes |
| `.../vault` | Memory management |
| `.../reflection` | Reflection journal |

---

## 6. Database Models

| Model | Purpose |
|-------|---------|
| **User** | Profile, roadmap, xp, streak, badges, skills, subscription, identity statements, burnout fields |
| **Message** | Chat history (role, content, emotion, counsellorType) |
| **Journey** | Tracks and levels (locked/unlocked/completed) |
| **Insight** | Weekly summaries, debriefs, burnout trends |
| **Memory** | Long-term AI context (fact, goal, emotion_pattern, etc.) |
| **SelfState** | Current emotion, communication style, history |
| **Contract** | Goal accountability with check-ins |
| **Reflection** | Journal entries with mood snapshot |
| **StudyRoom** | Collaborative rooms and sessions |
| **RoomMessage** | Persisted room chat |

---

## 7. API Reference (Base: `/api/v1`)

### User
| Method | Path | Description |
|--------|------|-------------|
| POST | `/user/` | Register |
| POST | `/user/login` | Login (JWT cookie) |
| GET | `/user/userDashboard` | Dashboard data |
| GET | `/user/roadmap` | Get roadmap |
| GET | `/user/allReports` | List reports |
| GET | `/user/memories` | List memories |
| DELETE | `/user/memories/:id` | Delete memory |
| POST | `/user/identity-statements` | Add identity statement |

### Chat
| Method | Path | Description |
|--------|------|-------------|
| GET | `/chat/:counselorType` | Load chat history |
| POST | `/chat/` | Send message (AI reply) |
| POST | `/chat/roadmap` | Generate roadmap |
| POST | `/chat/report` | Generate PDF/CSV report |
| POST | `/chat/tts` | Text-to-speech |

### Journey
| Method | Path | Description |
|--------|------|-------------|
| GET | `/journey` | Get journey map |
| POST | `/journey/assessment` | Generate quiz |
| PATCH | `/journey/progress` | Submit quiz result |

### Insights
| Method | Path | Description |
|--------|------|-------------|
| GET | `/insights/latest` | Latest weekly insight |
| POST | `/insights/trigger` | Manual insight (Pro) |
| POST | `/insights/debrief` | Session debrief (Pro) |

### Other
| Prefix | Description |
|--------|-------------|
| `/gamification/profile` | XP, level, badges |
| `/payment/*` | Stripe checkout & status |
| `/contracts/*` | Goal contracts |
| `/rooms/*` | Study rooms CRUD & actions |

---

## 8. AI Pipeline

| Task | Provider | Model |
|------|----------|-------|
| Chat, roadmaps, insights, memory, quizzes, reports, burnout | Groq | llama-3.3-70b-versatile |
| Skill extraction from goals | Google Gemini | gemini-2.0-flash |
| Emotion per message | Hugging Face | distilroberta emotion |
| Voice output | ElevenLabs | Per persona/language |

---

## 9. Security

- Bcrypt password hashing
- JWT in HTTP-only cookies; Clerk OAuth sync
- `protectCookie` on protected routes; `requirePlan` for Pro features
- CORS: localhost dev origins only
- Report downloads restricted to owning user ID in filename
- Emotion labels sanitized before AI prompt injection

---

## 10. Frontend Routes

| Path | Page |
|------|------|
| `/` | Home (landing) |
| `/login`, `/register` | Authentication |
| `/counselors` | Choose counselor |
| `/counselors/chat/:type` | Chat session |
| `/tools` | Tools hub |
| `/account/dashboard/*` | Dashboard (reports, profile, journey, vault, reflection) |
| `/study-rooms`, `/study-rooms/:id` | Study rooms |
| `/upgrade` | Subscription |
| `/visualRoadmap` | Mermaid roadmap view |

---

## 11. Scheduled Jobs (Cron)

- **Weekly insights** — Generate and email per user (batched, 10 at a time)
- **Contract finalization** — Process expired active contracts

---

## 12. Competitive Positioning

| Competitor | Strength | Gap Mind-Guide Fills |
|------------|----------|----------------------|
| Khanmigo | Tutoring | No emotion, no gamification, weak memory |
| Duolingo | Gamification | No mentorship, domain-limited |
| Woebot / Wysa | Emotional support | No learning roadmaps or XP |
| Notion AI | Knowledge | No coaching relationship |

**Unique combination:** Emotional awareness + roadmaps + gamification + persistent memory + accountability contracts.

---

## 13. Limitations & Future Work

**Current limitations:**
- Hugging Face API can be slow or rate-limited
- Roadmap JSON parsing fragile if AI output format drifts
- Insight cron may need job queue at scale
- Report files stored locally (should use cloud storage in production)

**Planned (see `mind-guide-master-plan.md`):** Seasons, friction detection, shareable debriefs, B2B wellness dashboards, expanded behavioral mechanics.

---

## 14. How to Run

1. Start MongoDB
2. `server/`: copy `.env`, `npm install`, `npm run dev` → port 3005
3. `client/`: `npm install`, `npm run dev` → port 5173
4. Required env: `MONGO_URI`, `JWT_SECRET`, `GROQ_API_KEY`, `GEMINI_API_KEY`, `HUGGINGFACE_API_KEY`, Clerk/Stripe keys as needed

---

## 15. Report Generation Prompt (for Gemini)

Copy the section below when asking Gemini to write your report:

```
Read PROJECT-DESCRIPTION.md for Mind-Guide. Write a formal project report with:
Abstract, Introduction, Problem Statement, Objectives, Literature Review,
System Design, Technology Stack, Module Implementation, Database Design,
API Overview, AI/ML Pipeline, Security, Testing Approach, Demo Flow,
Limitations, Future Scope, Conclusion.
Use only features documented in this file. Include tables and diagrams where helpful.
```

---

*Mind-Guide — Saarthi.ai*
