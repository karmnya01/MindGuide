const { Server } = require("socket.io");
const StudyRoom = require("../model/StudyRoom");
const RoomMessage = require("../model/RoomMessage");

const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: ["http://localhost:5173", "http://localhost:5174"],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    // console.log("New neural link established:", socket.id);

    // ─── Room Connection ──────────────────────────────────────────
    socket.on("join_room", async ({ roomId, user }) => {
      socket.join(roomId);
      // console.log(`User ${user.name} joined room: ${roomId}`);
      
      // Update DB presence
      await StudyRoom.findByIdAndUpdate(roomId, { $addToSet: { participants: user._id } });
      
      // Broadcast to others
      socket.to(roomId).emit("user_joined", { user, socketId: socket.id });
    });

    socket.on("leave_room", async ({ roomId, user }) => {
      socket.leave(roomId);
      // console.log(`User ${user.name} left room: ${roomId}`);
      
      // Update DB presence
      await StudyRoom.findByIdAndUpdate(roomId, { $pull: { participants: user._id } });
      
      socket.to(roomId).emit("user_left", { userId: user._id });
    });

    // ─── Chat System ──────────────────────────────────────────────
    socket.on("send_message", async ({ roomId, message }) => {
      // Broadcast to others in room
      io.to(roomId).emit("new_message", message);
    });

    // ─── Focus Sessions ───────────────────────────────────────────
    socket.on("start_focus_session", ({ roomId, duration }) => {
      io.to(roomId).emit("focus_session_started", { duration });
    });

    socket.on("sync_timer", ({ roomId, timeLeft }) => {
      socket.to(roomId).emit("timer_updated", timeLeft);
    });

    socket.on("complete_focus_session", ({ roomId, summary }) => {
      io.to(roomId).emit("focus_session_completed", summary);
    });

    // ─── Presence & Reactions ─────────────────────────────────────
    socket.on("presence_update", ({ roomId, userId, status }) => {
      socket.to(roomId).emit("user_status_update", { userId, status });
    });

    socket.on("send_reaction", ({ roomId, reaction }) => {
      io.to(roomId).emit("new_reaction", reaction);
    });

    socket.on("disconnect", () => {
      // console.log("Neural link severed:", socket.id);
    });
  });

  return io;
};

module.exports = initSocket;
