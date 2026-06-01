const asyncHandler = require("express-async-handler");
const StudyRoom = require("../model/StudyRoom");
const RoomMessage = require("../model/RoomMessage");
const RoomSession = require("../model/RoomSession");

// @desc    Create a new study room
// @route   POST /api/v1/rooms
const createRoom = asyncHandler(async (req, res) => {
  const { roomName, description, category, visibility, maxParticipants, tags } = req.body;

  if (!roomName) {
    res.status(400);
    throw new Error("Room name is required");
  }

  const room = await StudyRoom.create({
    roomName,
    description,
    category,
    visibility,
    maxParticipants,
    tags,
    createdBy: req.user._id,
    participants: [req.user._id],
  });

  res.status(201).json({ success: true, data: room });
});

// @desc    Get all public study rooms or search
// @route   GET /api/v1/rooms?search=keyword
const getAllRooms = asyncHandler(async (req, res) => {
  const { search, category } = req.query;
  const query = { visibility: "public", isArchived: false };

  if (category && category !== "All") {
    query.category = category;
  }

  if (search) {
    query.$or = [
      { roomName: { $regex: search, $options: "i" } },
      { tags: { $in: [new RegExp(search, "i")] } },
      { description: { $regex: search, $options: "i" } }
    ];
  }

  const rooms = await StudyRoom.find(query)
    .populate("createdBy", "name pic")
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, data: rooms });
});

// @desc    Get room by ID
// @route   GET /api/v1/rooms/:id
const getRoomById = asyncHandler(async (req, res) => {
  const room = await StudyRoom.findById(req.params.id)
    .populate("createdBy", "name pic")
    .populate("participants", "name pic burnoutScore energyLevel");

  if (!room) {
    res.status(404);
    throw new Error("Room not found");
  }

  const messages = await RoomMessage.find({ roomId: room._id })
    .populate("sender", "name pic")
    .sort({ createdAt: -1 })
    .limit(50);

  res.status(200).json({ success: true, data: { room, messages: messages.reverse() } });
});

// @desc    Join a room
// @route   POST /api/v1/rooms/:id/join
const joinRoom = asyncHandler(async (req, res) => {
  const room = await StudyRoom.findById(req.params.id);

  if (!room) {
    res.status(404);
    throw new Error("Room not found");
  }

  // Check Privacy
  if (room.visibility !== "public" && room.createdBy.toString() !== req.user._id.toString()) {
      const isParticipant = room.participants.includes(req.user._id);
      if (!isParticipant) {
          res.status(401);
          throw new Error("This is a private room. Access restricted.");
      }
  }

  if (room.participants.length >= room.maxParticipants) {
    res.status(400);
    throw new Error("Room is at maximum capacity");
  }

  const updatedRoom = await StudyRoom.findByIdAndUpdate(
    req.params.id,
    { $addToSet: { participants: req.user._id } },
    { new: true }
  ).populate("participants", "name pic");

  res.status(200).json({ success: true, data: updatedRoom });
});

// @desc    Leave a room
// @route   POST /api/v1/rooms/:id/leave
const leaveRoom = asyncHandler(async (req, res) => {
  const room = await StudyRoom.findByIdAndUpdate(
    req.params.id,
    { $pull: { participants: req.user._id } },
    { new: true }
  );

  res.status(200).json({ success: true, message: "Left room successfully" });
});

// @desc    Start a focus session
// @route   POST /api/v1/rooms/:id/session/start
const startFocusSession = asyncHandler(async (req, res) => {
  const { goal, duration } = req.body;
  const roomId = req.params.id;

  const room = await StudyRoom.findById(roomId);
  if (!room) {
    res.status(404);
    throw new Error("Room not found");
  }

  const session = await RoomSession.create({
    roomId,
    goal,
    durationMinutes: duration,
    participants: room.participants.map(p => ({ user: p })),
  });

  await StudyRoom.findByIdAndUpdate(roomId, {
    activeSession: {
      isLive: true,
      startTime: new Date(),
      duration,
      goal,
    }
  });

  res.status(200).json({ success: true, data: session });
});

// @desc    Send a message
// @route   POST /api/v1/rooms/:id/message
const sendMessage = asyncHandler(async (req, res) => {
  const { content, messageType, metadata } = req.body;
  const roomId = req.params.id;

  const message = await RoomMessage.create({
    roomId,
    sender: req.user._id,
    content,
    messageType,
    metadata,
  });

  const populatedMessage = await RoomMessage.findById(message._id).populate("sender", "name pic");

  res.status(201).json({ success: true, data: populatedMessage });
});

module.exports = {
  createRoom,
  getAllRooms,
  getRoomById,
  joinRoom,
  leaveRoom,
  startFocusSession,
  sendMessage,
};
