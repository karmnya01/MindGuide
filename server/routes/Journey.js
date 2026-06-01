const express = require("express");
const {
  getJourney,
  createJourney,
  generateAssessment,
  updateProgress,
  continueJourney,
} = require("../controllers/journeyController");
const { protectCookie } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/").get(protectCookie, getJourney).post(protectCookie, createJourney);
router.post("/assessment", protectCookie, generateAssessment);
router.patch("/progress", protectCookie, updateProgress);
router.post("/continue", protectCookie, continueJourney);

module.exports = router;
