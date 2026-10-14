import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import notificationService from "../services/notificationService";
import { Bell, CheckCheck, Clock, CheckCircle2, XCircle, ArrowRight, Sparkles, Filter, Inbox, Phone } from "lucide-react";
import NativeDialerButton from "./NativeDialerButton";

export const NotificationsCenter = () => {
    const { fetchNotifications, setActiveTab, setSelectedDonationForRequestsView, setIsViewRequestsModalOpen, addToast } = useApp();
    const { user } = useAuth();

    const [notifications, setNotifications] = useState([]);
    const [filter, setFilter] = useState("all"); // 'all' | 'unread'
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadNotifications();
    }, [filter]);

    const loadNotifications = async () => {
        setLoading(true);
        try {
            const params = {};
            if (filter === "unread") params.unreadOnly = "true";
            const data = await notificationService.getNotifications(params);
            setNotifications(data || []);
        } catch (err) {
            console.error("Failed to load notifications:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (id, e) => {
        if (e) e.stopPropagation();
        try {
            await notificationService.markAsRead(id);
            setNotifications(prev =>
                prev.map(n => (n._id === id ? { ...n, isRead: true } : n))
            );
            await fetchNotifications();
        } catch (err) {
            addToast("Failed to mark notification as read", "error");
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            addToast("All notifications marked as read", "success");
            await fetchNotifications();
        } catch (err) {
            addToast("Failed to mark all as read", "error");
        }
    };

    const handleNotificationClick = (item) => {
        if (!item.isRead) {
            handleMarkAsRead(item._id);
        }

        // Role-based navigation on click
        if (user?.role === "supplier") {
            // Open incoming requests tab
            setActiveTab("incoming-requests");
        } else {
            // Open my requests tab
            setActiveTab("my-requests");
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case "REQUEST_ACCEPTED":
                return <CheckCircle2 size={18} style={{ color: "#10b981" }} />;
            case "REQUEST_REJECTED":
                return <XCircle size={18} style={{ color: "#ef4444" }} />;
            case "REQUEST_SUBMITTED":
                return <Clock size={18} style={{ color: "#f59e0b" }} />;
            default:
                return <Sparkles size={18} style={{ color: "#3b82f6" }} />;
        }
    };

    const unreadTotal = notifications.filter(n => !n.isRead).length;

    return (
        <div className="data-panel-card" id="notifications-center-view">
            {/* Header */}
            <div className="panel-header" style={{ marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
                <div className="panel-title-group">
                    <h2 style={{ fontSize: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
                        <Bell size={22} style={{ color: "#00b87c" }} />
                        <span>Notifications</span>
                        {unreadTotal > 0 && (
                            <span
                                style={{
                                    fontSize: "12px",
                                    fontWeight: "800",
                                    background: "#fee2e2",
                                    color: "#b91c1c",
                                    padding: "2px 8px",
                                    borderRadius: "12px"
                                }}
                            >
                                {unreadTotal} unread
                            </span>
                        )}
                    </h2>
                    <p className="panel-subtitle">
                        Role-aware activity updates, request status decisions, and inventory alerts
                    </p>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    {/* Filter Pills */}
                    <div className="filter-pills-row">
                        <button
                            id="btn-notif-filter-all"
                            className={`filter-pill ${filter === "all" ? "active" : ""}`}
                            onClick={() => setFilter("all")}
                        >
                            All ({notifications.length})
                        </button>
                        <button
                            id="btn-notif-filter-unread"
                            className={`filter-pill ${filter === "unread" ? "active" : ""}`}
                            onClick={() => setFilter("unread")}
                        >
                            Unread ({unreadTotal})
                        </button>
                    </div>

                    {/* Mark All as Read */}
                    {unreadTotal > 0 && (
                        <button
                            id="btn-mark-all-read"
                            className="btn-panel-action"
                            onClick={handleMarkAllAsRead}
                            title="Mark all notifications as read"
                        >
                            <CheckCheck size={14} />
                            <span>Mark All Read</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Notification List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {loading ? (
                    <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                        <p>Loading notifications...</p>
                    </div>
                ) : notifications.length > 0 ? (
                    notifications.map((item) => (
                        <div
                            key={item._id}
                            id={`notification-${item._id}`}
                            onClick={() => handleNotificationClick(item)}
                            style={{
                                display: "flex",
                                alignItems: "flex-start",
                                justifyContent: "space-between",
                                gap: "14px",
                                padding: "16px 18px",
                                borderRadius: "12px",
                                border: item.isRead ? "1px solid #e2e8f0" : "1.5px solid #00b87c",
                                background: item.isRead ? "#ffffff" : "#f0fdf4",
                                cursor: "pointer",
                                transition: "all 0.15s ease",
                                boxShadow: item.isRead ? "none" : "0 2px 8px rgba(0, 184, 124, 0.08)"
                            }}
                        >
                            <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                                <div
                                    style={{
                                        width: "36px",
                                        height: "36px",
                                        borderRadius: "50%",
                                        background: item.isRead ? "#f1f5f9" : "#ffffff",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexShrink: 0,
                                        boxShadow: "0 1px 3px rgba(0,0,0,0.06)"
                                    }}
                                >
                                    {getNotificationIcon(item.type)}
                                </div>

                                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <span style={{ fontWeight: item.isRead ? "600" : "800", color: "#0f172a", fontSize: "14px" }}>
                                            {item.title}
                                        </span>
                                        {!item.isRead && (
                                            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#00b87c" }} />
                                        )}
                                    </div>

                                    <p style={{ fontSize: "13px", color: "#334155", lineHeight: "1.4" }}>
                                        {item.message}
                                    </p>

                                    {/* Metadata details */}
                                    {item.metadata && (
                                        <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "12px", color: "#64748b", marginTop: "2px", flexWrap: "wrap" }}>
                                            {item.metadata.foodName && (
                                                <span><strong>Item:</strong> {item.metadata.foodName}</span>
                                            )}
                                            {item.metadata.quantity && (
                                                <span><strong>Qty:</strong> {item.metadata.quantity} {item.metadata.unit || "Meals"}</span>
                                            )}
                                            {item.metadata.location && (
                                                <span><strong>Location:</strong> {item.metadata.location}</span>
                                            )}
                                            {item.metadata.pickupInstructions && (
                                                <span style={{ color: "#047857" }}>
                                                    <strong>Pickup:</strong> {item.metadata.pickupInstructions}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    <span style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>
                                        {new Date(item.createdAt).toLocaleDateString()} at{" "}
                                        {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                    </span>
                                </div>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                                {item.metadata?.contactPhone && (
                                    <NativeDialerButton
                                        phoneNumber={item.metadata.contactPhone}
                                        label="Call"
                                        size="sm"
                                        variant="success"
                                        id={`btn-call-notif-${item._id}`}
                                    />
                                )}
                                {!item.isRead && (
                                    <button
                                        className="btn-table-action"
                                        style={{ fontSize: "11px", padding: "4px 8px" }}
                                        onClick={(e) => handleMarkAsRead(item._id, e)}
                                        title="Mark as read"
                                    >
                                        Mark Read
                                    </button>
                                )}
                                <span style={{ color: "#00b87c", display: "flex", alignItems: "center" }}>
                                    <ArrowRight size={14} />
                                </span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div style={{ textAlign: "center", padding: "60px 20px", color: "#64748b" }}>
                        <Inbox size={40} style={{ margin: "0 auto 12px auto", opacity: 0.4 }} />
                        <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a" }}>No Notifications</h3>
                        <p style={{ fontSize: "13px", marginTop: "4px" }}>
                            {filter === "unread" ? "You have no unread notifications." : "Activity updates and decision alerts will appear here."}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationsCenter;
