const Notification = require("../models/Notification");

// GET /api/notifications - List notifications for logged-in user
exports.getNotifications = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required to view notifications"
            });
        }

        const filter = { recipientUserId: req.user.id };

        if (req.query.unreadOnly === "true" || req.query.isRead === "false") {
            filter.isRead = false;
        }

        const notifications = await Notification.find(filter)
            .sort({ createdAt: -1 })
            .limit(50);

        res.status(200).json({
            success: true,
            count: notifications.length,
            data: notifications
        });
    } catch (error) {
        next(error);
    }
};

// GET /api/notifications/unread-count - Count unread notifications
exports.getUnreadCount = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(200).json({ success: true, count: 0 });
        }

        const count = await Notification.countDocuments({
            recipientUserId: req.user.id,
            isRead: false
        });

        res.status(200).json({
            success: true,
            count
        });
    } catch (error) {
        next(error);
    }
};

// PATCH /api/notifications/:id/read - Mark single notification as read
exports.markAsRead = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Authentication required" });
        }

        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, recipientUserId: req.user.id },
            { $set: { isRead: true } },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found or access denied"
            });
        }

        res.status(200).json({
            success: true,
            message: "Notification marked as read",
            data: notification
        });
    } catch (error) {
        next(error);
    }
};

// PATCH /api/notifications/read-all - Mark all user notifications as read
exports.markAllAsRead = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Authentication required" });
        }

        const result = await Notification.updateMany(
            { recipientUserId: req.user.id, isRead: false },
            { $set: { isRead: true } }
        );

        res.status(200).json({
            success: true,
            message: "All notifications marked as read",
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        next(error);
    }
};
