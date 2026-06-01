require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/connectDB");
const userRouter = require("./routes/User");
const chatRouter = require("./routes/Chat");
const gamificationRouter = require("./routes/Gamification");
const journeyRouter = require("./routes/Journey");
const insightRouter = require("./routes/Insight");
const paymentRouter = require("./routes/paymentRoutes");
const contractRoutes = require("./routes/contractRoutes");
const studyRoomRoutes = require("./routes/studyRoomRoutes");
const { clerkMiddleware } = require("@clerk/express");
const { errorHandler, notFound } = require("./middleware/errorMiddleware");
const { startCronJobs } = require("./services/cronService");

const http = require("http");
const initSocket = require("./socket/index");

const app = express();
const server = http.createServer(app);
const port = 3005;

// Initialize Socket
const io = initSocket(server);
app.set("io", io);

app.use(bodyParser.json());
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(clerkMiddleware());

const path = require("path");

app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/v1/user", userRouter);
app.use("/api/v1/chat", chatRouter);
app.use("/api/v1/gamification", gamificationRouter);
app.use("/api/v1/journey", journeyRouter);
app.use("/api/v1/insights", insightRouter);
app.use("/api/v1/payment", paymentRouter);
app.use("/api/v1/contracts", contractRoutes);
app.use("/api/v1/rooms", studyRoomRoutes);

app.use(notFound);
app.use(errorHandler);

const start = async () => {
  try {
    await connectDB();
    server.listen(port, () => {
      console.log(`Server is running on port ${port}`);
      startCronJobs();
    });
  } catch (error) {
    console.error("Server startup error:", error);
  }
};

start();
