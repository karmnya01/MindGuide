const express = require("express");
const router = express.Router();
const { protectCookie } = require("../middleware/authMiddleware");
const {
  createRoom,
  getAllRooms,
  getRoomById,
  joinRoom,
  leaveRoom,
  startFocusSession,
  sendMessage,
} = require("../controllers/studyRoomController");

// Basic CRUD
router.route("/").get(protectCookie, getAllRooms).post(protectCookie, createRoom);
router.route("/:id").get(protectCookie, getRoomById);

// Actions
router.post("/:id/join", protectCookie, joinRoom);
router.post("/:id/leave", protectCookie, leaveRoom);
router.post("/:id/session/start", protectCookie, startFocusSession);
router.post("/:id/message", protectCookie, sendMessage);

module.exports = router;
