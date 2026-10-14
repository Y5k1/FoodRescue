import React from "react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { HeartHandshake, Plus, Utensils, User, LogOut, Bell, ShieldCheck } from "lucide-react";

export const Header = () => {
    const {
        viewMode,
        setViewMode,
        setIsDonationModalOpen,
        setIsProfileModalOpen,
        openAuthModal,
        unreadCount,
        setActiveTab
    } = useApp();

    const { user, isAuthenticated, logout } = useAuth();

    return (
        <header className="header-container" id="main-header">
            <div className="header-top">
                {/* Brand Logo & Tagline */}
                <div className="brand-section">
                    <div className="brand-logo-icon" aria-label="FoodRescue Logo">
                        <HeartHandshake size={22} strokeWidth={2.2} />
                    </div>
                    <div className="brand-info">
                        <div className="brand-title-row">
                            <span className="brand-title">FoodRescue</span>
                            <span className="brand-badge">Microservices v2.4</span>
                        </div>
                        <span className="brand-subtitle">
                            Sustainable Food Redistribution & Real-Time REST Matching
                        </span>
                    </div>
                </div>

                {/* View Filters & Primary Actions */}
                <div className="header-actions">
                    {/* View Switcher (for guests / explore mode) */}
                    {!isAuthenticated && (
                        <div className="view-selector" role="group" aria-label="Dashboard Views">
                            <span className="view-label">
                                <ShieldCheck size={13} /> View:
                            </span>
                            <button
                                id="view-all-btn"
                                className={`view-btn ${viewMode === "all" ? "active" : ""}`}
                                onClick={() => setViewMode("all")}
                            >
                                All Architecture
                            </button>
                            <button
                                id="view-donor-btn"
                                className={`view-btn ${viewMode === "donor" ? "active" : ""}`}
                                onClick={() => setViewMode("donor")}
                            >
                                Donor View
                            </button>
                            <button
                                id="view-receiver-btn"
                                className={`view-btn ${viewMode === "receiver" ? "active" : ""}`}
                                onClick={() => setViewMode("receiver")}
                            >
                                Receiver Hub
                            </button>
                        </div>
                    )}

                    {/* Supplier Quick Action: Post Food Donation */}
                    {(user?.role === "supplier" || (!isAuthenticated && (viewMode === "all" || viewMode === "donor"))) && (
                        <button
                            id="btn-header-donate"
                            className="btn-donate-quick"
                            onClick={() => setIsDonationModalOpen(true)}
                        >
                            <Plus size={16} strokeWidth={2.5} />
                            <span>Post Food Donation</span>
                        </button>
                    )}

                    {/* Requester Quick Action: Browse Available Food */}
                    {(user?.role === "requester" || (!isAuthenticated && (viewMode === "all" || viewMode === "receiver"))) && (
                        <button
                            id="btn-header-request"
                            className="btn-request-quick"
                            onClick={() => setActiveTab("browse-food")}
                        >
                            <Utensils size={15} strokeWidth={2.2} />
                            <span>Browse Surplus Food</span>
                        </button>
                    )}

                    {/* Unread Notifications Bell */}
                    {isAuthenticated && (
                        <button
                            id="btn-header-notifications"
                            className="user-badge-btn"
                            style={{ position: "relative", padding: "6px 10px" }}
                            onClick={() => setActiveTab("notifications")}
                            title="Notifications Center"
                        >
                            <Bell size={16} />
                            {unreadCount > 0 && (
                                <span
                                    style={{
                                        position: "absolute",
                                        top: "-4px",
                                        right: "-4px",
                                        background: "#ef4444",
                                        color: "#ffffff",
                                        fontSize: "10px",
                                        fontWeight: "800",
                                        width: "18px",
                                        height: "18px",
                                        borderRadius: "50%",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        boxShadow: "0 0 6px rgba(239, 68, 68, 0.6)"
                                    }}
                                >
                                    {unreadCount > 9 ? "9+" : unreadCount}
                                </span>
                            )}
                        </button>
                    )}

                    {/* User Profile / Auth Toggle */}
                    {isAuthenticated ? (
                        <div className="user-action-group" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <button
                                id="user-profile-btn"
                                className="user-badge-btn"
                                onClick={() => setIsProfileModalOpen(true)}
                                title="View Profile"
                            >
                                <User size={14} />
                                <span>{user?.name || "Account"}</span>
                                <span style={{ opacity: 0.6, fontSize: "11px", textTransform: "capitalize" }}>
                                    ({user?.role})
                                </span>
                            </button>
                            <button
                                id="user-logout-btn"
                                className="user-badge-btn"
                                onClick={logout}
                                title="Sign Out"
                                style={{ padding: "5px 8px" }}
                            >
                                <LogOut size={14} />
                            </button>
                        </div>
                    ) : (
                        <button
                            id="auth-login-btn"
                            className="user-badge-btn"
                            onClick={() => openAuthModal("login", "supplier")}
                        >
                            <User size={14} />
                            <span>Sign In</span>
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
