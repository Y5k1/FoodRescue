import React from "react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { Activity, Heart, Utensils, Bell, Inbox, Eye } from "lucide-react";

export const NavigationTabs = () => {
    const { activeTab, setActiveTab, counts, unreadCount } = useApp();
    const { user, isAuthenticated } = useAuth();

    const isSupplier = user?.role === "supplier";
    const isRequester = user?.role === "requester";

    return (
        <nav className="tabs-nav-bar" id="main-navigation-tabs" aria-label="Main Navigation">
            <div className="tabs-nav-content">
                {/* 1. Dashboard */}
                <button
                    id="tab-dashboard"
                    className={`nav-tab-item ${activeTab === "dashboard" ? "active" : ""}`}
                    onClick={() => setActiveTab("dashboard")}
                >
                    <Activity size={16} />
                    <span>Dashboard</span>
                </button>

                {/* SUPPLIER TABS */}
                {isSupplier && (
                    <>
                        <button
                            id="tab-my-donations"
                            className={`nav-tab-item ${activeTab === "my-donations" ? "active" : ""}`}
                            onClick={() => setActiveTab("my-donations")}
                        >
                            <Heart size={16} />
                            <span>My Donations</span>
                            <span className="nav-tab-badge green">{counts.donations}</span>
                        </button>

                        <button
                            id="tab-incoming-requests"
                            className={`nav-tab-item ${activeTab === "incoming-requests" ? "active" : ""}`}
                            onClick={() => setActiveTab("incoming-requests")}
                        >
                            <Inbox size={16} />
                            <span>Incoming Requests</span>
                            {counts.pendingIncoming > 0 && (
                                <span className="nav-tab-badge amber">{counts.pendingIncoming}</span>
                            )}
                        </button>
                    </>
                )}

                {/* REQUESTER TABS */}
                {isRequester && (
                    <>
                        <button
                            id="tab-browse-food"
                            className={`nav-tab-item ${activeTab === "browse-food" ? "active" : ""}`}
                            onClick={() => setActiveTab("browse-food")}
                        >
                            <Eye size={16} />
                            <span>Browse Food</span>
                            <span className="nav-tab-badge green">{counts.donations}</span>
                        </button>

                        <button
                            id="tab-my-requests"
                            className={`nav-tab-item ${activeTab === "my-requests" ? "active" : ""}`}
                            onClick={() => setActiveTab("my-requests")}
                        >
                            <Utensils size={16} />
                            <span>My Requests</span>
                            <span className="nav-tab-badge amber">{counts.requests}</span>
                        </button>
                    </>
                )}

                {/* GUEST / ALL ARCHITECTURE TABS */}
                {!isAuthenticated && (
                    <>
                        <button
                            id="tab-browse-food"
                            className={`nav-tab-item ${activeTab === "browse-food" || activeTab === "donations" ? "active" : ""}`}
                            onClick={() => setActiveTab("browse-food")}
                        >
                            <Heart size={16} />
                            <span>Available Food</span>
                            <span className="nav-tab-badge green">{counts.donations}</span>
                        </button>

                        <button
                            id="tab-my-requests"
                            className={`nav-tab-item ${activeTab === "my-requests" || activeTab === "requests" ? "active" : ""}`}
                            onClick={() => setActiveTab("my-requests")}
                        >
                            <Utensils size={16} />
                            <span>Food Requests</span>
                            <span className="nav-tab-badge amber">{counts.requests}</span>
                        </button>
                    </>
                )}

                {/* NOTIFICATIONS TAB (Replaces Dispatch entirely!) */}
                <button
                    id="tab-notifications"
                    className={`nav-tab-item ${activeTab === "notifications" ? "active" : ""}`}
                    onClick={() => setActiveTab("notifications")}
                >
                    <Bell size={16} />
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                        <span className="nav-tab-badge amber" style={{ background: "#fee2e2", color: "#b91c1c" }}>
                            {unreadCount}
                        </span>
                    )}
                </button>
            </div>
        </nav>
    );
};

export default NavigationTabs;
