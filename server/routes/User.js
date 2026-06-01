const express = require("express");
const {
  registerUser,
  authUser,
  getUserProfile,
  handleLogout,
  handleGetRoadmap,
  handleGetUserData,
  handleReportUpload,
  handleGetAllReports,
  handleGetSkills,
  handleGetMemories,
  handleDeleteMemory,
  handleAddIdentityStatement,
  handleDeleteIdentityStatement,
  handleUpgradeSuccess,
  handleGetReflections,
} = require("../controllers/userControllers");
const multer = require("multer");
const { protectCookie } = require("../middleware/authMiddleware");
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // Adjust based on your needs
});
const router = express.Router();

router.route("/").post(registerUser);
router.route("/login").post(authUser);
router.route("/getUserProfile").get(getUserProfile);
router.route("/logout").post(handleLogout);
router.route("/roadmap").get(protectCookie, handleGetRoadmap);
router.route("/userDashboard").get(protectCookie, handleGetUserData);
router.route("/allReports").get(protectCookie, handleGetAllReports);
router.route("/reflections").get(protectCookie, handleGetReflections);
router.post(
  "/uploadpdf/:counsellorType",
  protectCookie,
  upload.single("file"),
  handleReportUpload
);
router.route("/getSkills").get(protectCookie, handleGetSkills);

// F01: Memory Vault
router.route("/memories").get(protectCookie, handleGetMemories);
router.route("/memories/:id").delete(protectCookie, handleDeleteMemory);

// F07: Identity Statements
router.route("/identity-statements").post(protectCookie, handleAddIdentityStatement);
router.route("/identity-statements/:id").delete(protectCookie, handleDeleteIdentityStatement);

router.post("/upgrade-success", handleUpgradeSuccess);

module.exports = router;
