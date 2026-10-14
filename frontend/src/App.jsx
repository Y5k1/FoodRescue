import React, { useState } from "react";
import { useAuth } from "./context/AuthContext";
import { useApp } from "./context/AppContext";

import Header from "./components/Header";
import ArchitectureBar from "./components/ArchitectureBar";
import NavigationTabs from "./components/NavigationTabs";
import HeroBanner from "./components/HeroBanner";
import StatCards from "./components/StatCards";
import LiveMatchFeed from "./components/LiveMatchFeed";
import ApiEventStream from "./components/ApiEventStream";
import DonationsTab from "./components/DonationsTab";
import BrowseFoodView from "./components/BrowseFoodView";
import RequestsTab from "./components/RequestsTab";
import IncomingRequestsView from "./components/IncomingRequestsView";
import NotificationsCenter from "./components/NotificationsCenter";
import DonationModal from "./components/DonationModal";
import RequestModal from "./components/RequestModal";
import ProfileModal from "./components/ProfileModal";
import AuthLanding from "./components/AuthLanding";
import Toast from "./components/Toast";

export const App = () => {
    const { isAuthenticated, loading, user } = useAuth();
    const {
        activeTab,
        isAuthModalOpen,
        setIsAuthModalOpen,
        selectedDonationForRequestsView
    } = useApp();

    const [isDemoMode, setIsDemoMode] = useState(false);

    if (loading) {
        return (
            <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#06101c", color: "#34d399" }}>
                <div style={{ textAlign: "center" }}>
                    <div className="brand-logo-icon" style={{ margin: "0 auto 16px auto", width: "48px", height: "48px" }}>
                        🌱
                    </div>
                    <p style={{ fontWeight: "700", fontSize: "16px" }}>Connecting to FoodRescue Microservices...</p>
                </div>
            </div>
        );
    }

    // First screen requirement: If not authenticated and not in demo mode, show AuthLanding
    if (!isAuthenticated && !isDemoMode) {
        return (
            <>
                <AuthLanding onExploreDemo={() => setIsDemoMode(true)} />
                <Toast />
            </>
        );
    }

    return (
        <div className="app-layout" id="foodrescue-app-root">
            {/* Top Navigation & System Architecture Bar */}
            <Header />
            <ArchitectureBar />
            <NavigationTabs />

            {/* Main Application Content Body */}
            <main className="main-content-wrapper" id="main-content">
                {/* 1. DASHBOARD */}
                {activeTab === "dashboard" && (
                    <>
                        <HeroBanner />
                        <StatCards />
                        <div className="dashboard-middle-grid">
                            <LiveMatchFeed />
                            <ApiEventStream />
                        </div>
                    </>
                )}

                {/* 2. SUPPLIER: MY DONATIONS */}
                {(activeTab === "my-donations" || activeTab === "donations") && <DonationsTab />}

                {/* 3. SUPPLIER: INCOMING REQUESTS */}
                {activeTab === "incoming-requests" && (
                    <IncomingRequestsView
                        donationId={selectedDonationForRequestsView?._id}
                        donationTitle={selectedDonationForRequestsView?.foodName}
                    />
                )}

                {/* 4. REQUESTER: BROWSE SURPLUS FOOD */}
                {activeTab === "browse-food" && <BrowseFoodView />}

                {/* 5. REQUESTER: MY REQUESTS */}
                {(activeTab === "my-requests" || activeTab === "requests") && <RequestsTab />}

                {/* 6. NOTIFICATIONS CENTER (Completely replaced Dispatch/Router) */}
                {activeTab === "notifications" && <NotificationsCenter />}
            </main>

            {/* Interactive Modals */}
            <DonationModal />
            <RequestModal />
            <ProfileModal />

            {/* Auth Modal (if opened from top header while in guest/demo mode) */}
            {isAuthModalOpen && (
                <div className="modal-backdrop" onClick={() => setIsAuthModalOpen(false)}>
                    <div style={{ maxWidth: "800px", width: "100%" }} onClick={(e) => e.stopPropagation()}>
                        <AuthLanding onExploreDemo={() => setIsAuthModalOpen(false)} />
                    </div>
                </div>
            )}

            {/* Toast Notifications */}
            <Toast />
        </div>
    );
};

export default App;
