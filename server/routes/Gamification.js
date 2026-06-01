const express = require("express");
const { getGamificationProfile } = require("../controllers/gamificationController");
const { protectCookie } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/profile", protectCookie, getGamificationProfile);

module.exports = router;
