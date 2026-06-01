const express = require("express");
const {
  getLatestInsight,
  triggerInsight,
  createSessionDebrief,
} = require("../controllers/insightController");
const { protectCookie, requirePlan } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/latest", protectCookie, getLatestInsight);
router.post("/trigger", protectCookie, requirePlan(["pro", "enterprise"]), triggerInsight);
router.post("/debrief", protectCookie, requirePlan(["pro", "enterprise"]), createSessionDebrief);

module.exports = router;
