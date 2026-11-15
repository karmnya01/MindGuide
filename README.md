# PROJECT OVERVIEW
**Mind-Guide** is an AI-native SaaS platform designed to bridge the gap between traditional learning and personalized mentorship. It acts as an "AI Study Guide & Emotional Mentor" that doesn't just provide information but actively tracks, gamifies, and analyzes a user's learning path.

- **Core Purpose**: To provide high-agency, emotionally aware career and skill guidance through conversational AI that manifests into actionable, gamified roadmaps.
- **Target Users**: Students, self-learners, career switchers, and individuals seeking structured self-improvement.
- **Current Value Proposition**: Real-time "human-like" emotional support combined with automated, structured progress tracking and weekly performance reporting.
- **Existing Features**:
    - **Multi-Persona AI Counselors**: Specialized mentors (General, Technical, Career, etc.) with specific voice and tone constraints.
    - **Emotion & Stress Analysis**: Real-time detection of user sentiment and stress levels using NLP.
    - **Gamified Journey Maps**: Conversion of AI-generated roadmaps into interactive levels with XP rewards.
    - **AI-Generated Assessments**: Dynamic 3-question MCQ quizzes generated on-the-fly to validate level completion.
    - **Weekly Insight Reports**: Automated Monday morning emails summarizing achievements, emotional trends, and suggestions.
    - **Voice Integration**: High-quality TTS for counselor interaction using ElevenLabs.

# TECH STACK
### Frontend
- **Framework**: React 18 (Vite-powered)
- **State Management**: Redux Toolkit (with `redux-persist`)
- **Styling**: Tailwind CSS + Framer Motion (Animations)
- **Visuals**: Chart.js (Analytics), Mermaid.js (Dynamic Roadmaps/Flowcharts)
- **Routing**: React Router v6
- **Voice**: ElevenLabs JS SDK + Web Speech API

### Backend
- **Runtime**: Node.js / Express
- **Database**: MongoDB (Mongoose ODM)
- **Auth**: JWT (stored in HTTP-only cookies) + Google OAuth 2.0
- **AI Models**: 
    - **Core Generation**: Google Gemini 1.5 Flash (via `@google/generative-ai`)
    - **NLP Analysis**: Hugging Face Inference (DistilRoBERTa for emotions, Personality_LM for personality)
    - **Voice**: ElevenLabs Multilingual v2
- **Scheduling**: Node-Cron (Weekly insights)
- **Notifications**: Nodemailer (Transactional emails)

# ARCHITECTURE
### High-Level Design
The project follows a standard **MERN Client-Server** architecture. The backend is structured into **Controllers, Services, and Models**, while the frontend utilizes a **Layout-Page-Component** pattern with global state orchestration.

### Folder Structure
- `client/`: React source code.
    - `src/redux/`: Global state (User Info).
    - `src/pages/`: Main views (ChatApp, Dashboard, JourneyMap).
    - `src/components/`: Modular UI (AssistantAvatar, Mermaid, ReportModal).
- `server/`: Express API.
    - `controllers/`: Request handling and AI orchestration.
    - `services/`: Business logic (Gamification, Insights, Journey generation).
    - `model/`: Mongoose schemas (User, Message, Journey, Insight).
    - `routes/`: API endpoint definitions.

### Request Lifecycle (Chat Example)
1. **Frontend**: User sends a message via `ChatApp.jsx`.
2. **Backend Entry**: `handleSendChat` controller is hit.
3. **NLP Parallel Process**: Hugging Face analyzes the user's emotion/tone.
4. **AI Generation**: Gemini is called with the conversation history + current emotion as a system hint.
5. **Post-Processing**: AI response is scanned for `[[STRESS_LEVEL: X]]` tags; if found, the score is extracted and the tag removed.
6. **Persistence**: The message and detected emotion are saved to MongoDB.
7. **Gamification**: XP and Streaks are updated asynchronously.

# DATABASE DOCUMENTATION (MongoDB)
### 1. User Model (`User.js`)
- **Profile**: name, email, hashed password, pic.
- **Progress**: `roadmap` (Array of Goal objects), `xp`, `level`, `streak`, `lastActive`.
- **History**: `sessionHistory`, `reportHistory`, `badges`.

### 2. Message Model (`Message.js`)
- `userId`: Reference to User.
- `role`: user/assistant/system.
- `content`: Text content.
- `emotion`: Detected sentiment (e.g., "joy", "anxiety") - **Indexed** for analytics.
- `counsellorType`: Tracks which persona was used.

### 3. Journey Model (`Journey.js`)
- `userId`: **Unique Reference**.
- `tracks`: Array of learning tracks.
    - `levels`: Array of level objects (id, title, xpReward, status: locked/unlocked/completed).

### 4. Insight Model (`Insight.js`)
- `userId`: Reference to User.
- `weekStart`: Date of the week start - **Indexed**.
- `summary`: AI-generated weekly summary text.
- `emotionBreakdown`: Map of emotion counts.

# API DOCUMENTATION (v1)
### User & Auth
- **POST `/user/register`**: Register a new user.
- **POST `/user/login`**: User login, returns JWT in cookie.
- **GET `/user/profile`**: Get current user's profile and stats.

### Chat & AI
- **POST `/chat/send`**: Main chat interface. Payload: `{ messages, counsellorType }`. Returns AI response + Stress Score + Tone Analysis.
- **POST `/chat/roadmap`**: Triggers AI to generate a roadmap JSON and persist it to the User and Journey models.
- **POST `/chat/tts`**: Converts text to speech using ElevenLabs.

### Journey & Gamification
- **GET `/journey`**: Retrieves the gamified track for the user.
- **POST `/journey/assessment`**: Generates a 3-question MCQ quiz for a specific level.
- **PATCH `/journey/progress`**: Validates quiz passing, awards XP, and unlocks subsequent levels.

# BUSINESS LOGIC
- **Gamification Algorithm**:
    - **Level Calculation**: `Math.floor(Math.sqrt(xp / 50))` (Non-linear scaling).
    - **XP Thresholds**: Level 1 (50), Level 2 (200), Level 3 (450), Level 4 (800).
    - **Streak Logic**: UTC-based calendar day comparison to prevent timezone bugs.
- **Roadmap-to-Journey Pipeline**: When an AI generates a roadmap, the `journeyService` automatically maps the "Goals" to "Levels", generating unique IDs and XP rewards.
- **AI Persona Constraints**: The `getSystemPrompt` function enforces "No bullet points", "Natural fillers", and "Stress level tagging" to maintain a human-like feel.

# FRONTEND SYSTEM
- **UI Architecture**: Component-driven with common `Layout`.
- **State Flow**: 
    - `userInfo` is stored in Redux for access control.
    - Chat history is locally fetched and managed within `ChatApp.jsx` but persisted in the DB for session recovery.
- **Visualization Pattern**: Mermaid.js renders roadmaps as dynamic graphs. `VisualRoadmap.jsx` parses raw JSON into Mermaid syntax on the fly.

# SECURITY
- **Authentication**: Clerk session tokens for OAuth sign-in, with legacy JWT-cookie sessions retained.
- **Auth Middleware**: `Shield` for protecting backend routes; `ProtectRoute` for frontend navigation.
- **CORS**: Configured in `server/index.js` from the comma-separated `CLIENT_URL` allowlist.

# PERFORMANCE
- **Database Indexing**: Compound indexing on `userId + createdAt` for fast chat history retrieval and `userId + weekStart` for insights.
- **Batch Processing**: The Insight CRON job processes users in clusters of 10 to prevent event-loop blocking.
- **Atomic Operations**: Uses MongoDB `$inc` for XP and streak updates to avoid race conditions during rapid chat interactions.

# EXTENSIBILITY
- **Safest Areas to Add Features**: 
    - New `counselorType` personas in `chatControllers.js`.
    - Additional `BADGE_DEFINITIONS` in `gamificationService.js`.
    - New visual components in `client/src/components/Dashboard/`.
- **Modular Systems**: The `journeyService` is designed to be track-agnostic; adding a "Career Track" or "Health Track" involves the same data schema.

# KNOWN ISSUES / DEBT
- **Technical Debt**: Emotion analysis depends on a public Hugging Face endpoint which can be slow or rate-limited.
- **Fragile Systems**: The Roadmap JSON parser relies on Regex to extract data from Gemini responses. If Gemini deviates significantly from the format, parsing fails.
- **Scalability**: Insight generation is serialized per user; with a large user base, this will need a message queue (e.g., BullMQ).

# PRODUCT POSITIONING
- **Strategic Category**: "Personal Growth OS".
- **Monetization**:
    - **Premium Personas**: Access to specialized expert counselors (e.g., Therapy-inspired, Senior Dev).
    - **Resource Integration**: E-commerce/Affiliate links for the "Paid" roadmap resources.
    - **B2B**: Corporate wellness integration for employee burnout tracking via the Stress/Emotion dashboard.

# AI HANDOFF SUMMARY
Dear AI Coding Assistant, when working on this repo:
1. **Adding Features**: If adding a new tracker, update the `User` model, create a corresponding `Model`, and use a `Service` for the logic.
2. **AI Responses**: Always ensure system prompts include `[[STRESS_LEVEL: X]]` as the backend expects this for data visualization.
3. **Data Integrity**: Never update XP manually in a controller; always use `awardXP` in `gamificationService.js` to ensure level recalculation.
4. **State Management**: Use `addUser` from `mindGuideSlice` to update global user context after any profile modification.
5. **Coding Convention**: The backend uses CommonJS (`require`), while the frontend uses ESM (`import`). Respect this boundary.
