const express = require("express");
const router = express.Router();
const {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead
} = require("../controllers/notificationController");
const { protect } = require("../middleware/auth");

router.use(protect); // all notification endpoints require authenticated user

router.get("/", getNotifications);
router.get("/unread-count", getUnreadCount);
router.patch("/read-all", markAllAsRead);
router.patch("/:id/read", markAsRead);

module.exports = router;
