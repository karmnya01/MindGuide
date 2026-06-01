const express = require("express");
const {
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
} = require("../controllers/chatControllers");
const { protect, protectCookie } = require("../middleware/authMiddleware");
// const { handleGetRoadmap } = require("../controllers/userControllers");

const router = express.Router();

router.get("/:counselorType", protectCookie, getChat);
router.post("/", protectCookie, handleSendChat);
router.post("/analyze-tone", protectCookie, handleAnalyzeTone);
router.post("/personality", protectCookie, handleAnalyzePersonality);
router.post("/tts", protectCookie, handleTextToSpeech);
router.post("/report", protectCookie, handleCreateReport);
router.get("/download/:fileName", protectCookie, handleDownloadReport);
router
  .route("/roadmap")
  .post(protectCookie, handleCreateRoadmap)
  .put(protectCookie, handleTaskUpdate);
router.post("/updateroadmap", handleRoadmapUpdation);

module.exports = router;
