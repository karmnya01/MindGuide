const asyncHandler = require("express-async-handler");
const User = require("../model/User");
const { syncUserReportHistory, getReportsDir } = require("../services/reportUtils");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
const jwt = require("jsonwebtoken");

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, pic } = req.body;
  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please enter all the fields");
  }
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }
  const user = await User.create({
    name,
    email,
    pic,
    password,
  });
  if (user) {
    res.status(201).json(user);
  } else {
    res.status(400);
    throw new Error("Failed to create the user!!");
  }
});

const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400);
    throw new Error("Please enter all the fields");
  }
  const user = await User.findOne({ email });
  if (!user) {
    res.status(400);
    throw new Error("Invalid Credentials");
  }
  // Check Password
  const isPasswordMatch = await user.matchPassword(password);
  if (!isPasswordMatch) {
    throw new Error("Invalid Credentials");
  }
  const token = user.createJWT();
  console.log("token", user);
  res.cookie("token", token, {
    expires: new Date(Date.now() + 604800000),
  });
  return res.status(200).json({
    ...user._doc,
    createdAt: user._id.getTimestamp(),
    password: undefined,
  });
});
const { getAuth, clerkClient } = require("@clerk/express");

const getUserProfile = asyncHandler(async (req, res) => {
  // 1. Check for Clerk Auth
  const { userId } = getAuth(req);
  if (userId) {
    const user = await User.findOne({ clerkId: userId }).select("-password");
    if (user) return res.json(user);
    
    // If not in DB yet, fetch from Clerk and sync
    const clerkUser = await clerkClient.users.getUser(userId);
    const newUser = await User.create({
      clerkId: userId,
      name: `${clerkUser.firstName} ${clerkUser.lastName}`.trim() || clerkUser.username,
      email: clerkUser.emailAddresses[0].emailAddress,
      pic: clerkUser.imageUrl,
      password: "clerk_oauth_user",
    });
    return res.json(newUser);
  }

  // 2. Fallback to Legacy JWT
  const { token } = req.cookies;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded._id).select("-password");
      return res.json(user);
    } catch (err) {
      return res.status(200).json(null);
    }
  }
  return res.status(200).json(null);
});
const handleLogout = asyncHandler(async (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ message: "Logged out successfully" });
});

const handleGetRoadmap = asyncHandler(async (req, res) => {
  console.log(req.user);
  try {
    // Assuming you're identifying the user somehow, such as through a JWT token
    const userId = req.user._id; // Replace with actual user identifier

    // Find the user by their ID
    const user = await User.findById(userId);

    // Check if the user exists and has a roadmap
    if (user && user.roadmap && user.roadmap.length > 0) {
      // If user has a roadmap, send it in the response
      return res.status(200).json({ roadmap: user.roadmap });
    } else {
      // If user does not have a roadmap, send a message indicating so
      return res.status(200).json({ roadmap: [] });
    }
  } catch (error) {
    // If an error occurs, send an error response
    console.error("Error fetching roadmap:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});
const handleGetUserData = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (user) {
      const validReports = await syncUserReportHistory(user, getReportsDir());
      const userObj = user.toObject();
      userObj.reportHistory = validReports;
      return res.status(200).json({ user: userObj });
    } else {
      return res.status(200).json({ user: null });
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});
const handleReportUpload = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }
  const { counsellorType } = req.params;
  const { email } = req.user;

  const fs = require("fs");
  const path = require("path");
  
  const reportDir = path.join(__dirname, "..", "reports");
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  const fileName = `report_${req.user._id}_${Date.now()}_${req.file.originalname}`;
  const filePath = path.join(reportDir, fileName);
  fs.writeFileSync(filePath, req.file.buffer);
  
  // Use the protected download endpoint instead of a direct link to avoid AccessDenied/XML issues
  const downloadUrl = `/api/v1/chat/download/${fileName}`;

  try {
    const updatedUser = await User.findOneAndUpdate(
      { email },
      {
        $push: {
          reportHistory: {
            title: `${counsellorType} Session Report`,
            filePath: downloadUrl,
            fileName: fileName
          },
        },
      },
      { new: true, upsert: true }
    );
    return res.status(200).send({
      message: "PDF archived locally successfully",
      url: downloadUrl,
      user: updatedUser,
    });
  } catch (err) {
    console.error("Error updating user with local report:", err);
    return res.status(500).send(err.message);
  }
});
const handleGetAllReports = asyncHandler(async (req, res) => {
  const { email } = req.user;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(200).json([]);

    const validReports = await syncUserReportHistory(user, getReportsDir());
    return res.status(200).json(validReports);
  } catch (error) {
    console.error("Error fetching/migrating reports:", error);
    return res.status(500).json({ error: "Internal server error during report retrieval" });
  }
});
const handleGetSkills = asyncHandler(async (req, res) => {
  // Make API request to fetch short heading based on the provided roadmap
  // Example:
  // console.log("heading started");
  // console.log("goalsss!!!!!!------------>");
  // const { email } = req.user;
  const { email } = req.user;
  const user = await User.findOne({ email });
  const getroadmap = user.roadmap;
  const goals = getroadmap.map((item) => item.Goal);
  console.log("goals: ", goals);
  // console.log(typeof getroadmap);
  // console.log(getroadmap);

  const Heading = [
    {
      role: "system",
      content: `given this is goals -> ${goals} go through this  goals   and split the goals into two categories one should have non technical skill that the goal is aiming to provide and in second category  out of it  provide me striclty   containing  techinal skill name  of  what this  goals is aiming to provide and strictly make sure to only add technical skills topic name strictly only and note that the tecnical skill name should  be in less bare minimum words.and if there is no technical skills then send me empty. The desired skill topic should reflect the main thing that  goals is trying to achieve and that technical skill name should be revelant in realm of development only and after splitting into two i want you to send me in strictly below format and dont add anything other than the format specified below very strictly. 
      [{
        "skill": "name of the skill",
        "type": "technical Or nontechnical",
      }] in json format only.
      `,
    },
  ];
  // console.log("Heading:", response.choices[0].message.content);
  // console.log(response.choices[0].message.content);
  try {
    const prompt = Heading.map((m) => m.content).join("\n");
    const result = await geminiModel.generateContent(prompt);
    let skillText = result.response.text();

    // Strip markdown code fences if present
    skillText = skillText.replace(/```json\s*/i, "").replace(/```\s*/g, "").trim();
    let skill = JSON.parse(skillText);

    user.skills = [...user.skills, ...skill];
    // user.roadmap = []; // FIX: Don't wipe the roadmap!
    await user.save();
    res.cookie("token", user.createJWT(), {
      expires: new Date(Date.now() + 604800000),
    });
    res.json(user);
  } catch (error) {
    console.log("error happened while saving skills", error);
    res.json("Error while saving User skills!!!");
  }
});
const Memory = require("../model/Memory");

const handleGetMemories = asyncHandler(async (req, res) => {
  const memories = await Memory.find({ userId: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: memories });
});

const handleDeleteMemory = asyncHandler(async (req, res) => {
  const memory = await Memory.findOneAndDelete({ 
    _id: req.params.id, 
    userId: req.user._id 
  });
  if (!memory) {
    res.status(404);
    throw new Error("Memory not found");
  }
  res.status(200).json({ success: true, message: "Memory removed" });
});

const handleAddIdentityStatement = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text) {
    res.status(400);
    throw new Error("Statement text is required");
  }
  const user = await User.findById(req.user._id);
  user.identityStatements.push({ text, source: "user" });
  await user.save();
  res.status(200).json({ success: true, data: user.identityStatements });
});

const handleDeleteIdentityStatement = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  user.identityStatements = user.identityStatements.filter(
    (s) => s._id.toString() !== req.params.id
  );
  await user.save();
  res.status(200).json({ success: true, message: "Statement removed" });
});

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const handleUpgradeSuccess = asyncHandler(async (req, res) => {
  const { sessionId } = req.body;
  if (!sessionId) {
    res.status(400);
    throw new Error("Session ID is required");
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status === "paid") {
      // Find user by session metadata or email
      const user = await User.findOneAndUpdate(
        { email: session.customer_details.email },
        { 
          subscriptionTier: "pro",
          stripeCustomerId: session.customer,
        },
        { new: true }
      );

      if (user) {
        return res.status(200).json({ success: true, user });
      }
    }
    res.status(400).json({ success: false, message: "Payment not verified" });
  } catch (error) {
    console.error("Stripe verification error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

const Reflection = require("../model/Reflection");

const handleGetReflections = asyncHandler(async (req, res) => {
  const reflections = await Reflection.find({ userId: req.user._id }).sort({ date: -1 });
  res.status(200).json({ success: true, data: reflections });
});

module.exports = {
  registerUser,
  authUser,
  getUserProfile,
  handleLogout,
  handleGetRoadmap,
  handleUpgradeSuccess,
  handleGetReflections,
  handleGetUserData,
  handleReportUpload,
  handleGetAllReports,
  handleGetSkills,
  handleGetMemories,
  handleDeleteMemory,
  handleAddIdentityStatement,
  handleDeleteIdentityStatement,
};
