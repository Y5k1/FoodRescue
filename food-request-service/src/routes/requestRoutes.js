const express = require("express");
const router = express.Router();

const {
    createRequest,
    getRequests,
    getRequestById,
    acceptRequest,
    rejectRequest,
    fulfillRequest,
    cancelRequest,
    getRequestStats,
    getEventLogs
} = require("../controllers/requestController");

const { optionalAuth, protect, authorize } = require("../middleware/auth");

router.get("/stats", optionalAuth, getRequestStats);
router.get("/events", getEventLogs);

router.get("/", optionalAuth, getRequests);
router.post("/", protect, createRequest);
router.get("/:id", optionalAuth, getRequestById);

// Workflow actions
router.post("/:id/accept", protect, acceptRequest);
router.post("/:id/reject", protect, rejectRequest);
router.post("/:id/fulfill", protect, fulfillRequest);
router.post("/:id/cancel", protect, cancelRequest);

module.exports = router;
