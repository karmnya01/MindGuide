const express = require("express");
const router = express.Router();
const { protectCookie } = require("../middleware/authMiddleware");
const asyncHandler = require("express-async-handler");
const {
  createContract,
  processCheckIn,
  finalizeContract,
} = require("../services/contractService");
const Contract = require("../model/Contract");

// GET all active contracts for user
router.get(
  "/",
  protectCookie,
  asyncHandler(async (req, res) => {
    const contracts = await Contract.find({ userId: req.user._id, status: "active" });
    res.status(200).json({ success: true, data: contracts });
  })
);

// POST create contract
router.post(
  "/",
  protectCookie,
  asyncHandler(async (req, res) => {
    // Subscription Limit Check
    if (req.user.subscriptionTier === "free") {
        const count = await Contract.countDocuments({ userId: req.user._id, status: "active" });
        if (count >= 1) {
            res.status(403);
            throw new Error("Free plan is limited to 1 active goal contract. Please upgrade to Pro for unlimited contracts.");
        }
    }

    const contract = await createContract(req.user._id, req.body);
    res.status(201).json({ success: true, data: contract });
  })
);

// POST check-in
router.post(
  "/:id/checkin",
  protectCookie,
  asyncHandler(async (req, res) => {
    const contract = await processCheckIn(req.params.id, req.body);
    res.status(200).json({ success: true, data: contract });
  })
);

module.exports = router;
