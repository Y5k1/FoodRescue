import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import donationService from "../services/donationService";
import requestService from "../services/requestService";
import notificationService from "../services/notificationService";

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
    const [activeTab, setActiveTab] = useState("dashboard");
    const [viewMode, setViewMode] = useState("all"); // 'all' | 'donor' | 'receiver'

    // System Architecture status
    const [svc1Status, setSvc1Status] = useState({
        healthy: false,
        latencyMs: 24,
        database: "disconnected",
        loading: true
    });
    const [svc2Status, setSvc2Status] = useState({
        healthy: false,
        latencyMs: 18,
        database: "disconnected",
        loading: true
    });

    // Metrics & Counts
    const [stats, setStats] = useState({
        totalMealsRescued: 1485,
        activeDonations: 3,
        openNgoRequests: 2,
        co2WastePreventedKg: 3712
    });

    const [counts, setCounts] = useState({
        donations: 3,
        requests: 2,
        pendingIncoming: 0,
        unreadNotifications: 0
    });

    // Notifications state
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    // Modals & Selections
    const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [selectedDonationForRequest, setSelectedDonationForRequest] = useState(null);
    const [selectedDonationForRequestsView, setSelectedDonationForRequestsView] = useState(null);
    const [isViewRequestsModalOpen, setIsViewRequestsModalOpen] = useState(false);

    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [authModalMode, setAuthModalMode] = useState("login");
    const [authInitialRole, setAuthInitialRole] = useState("supplier");

    // Live Feed & Logs
    const [feedItems, setFeedItems] = useState([]);
    const [eventLogs, setEventLogs] = useState([]);

    // Toasts
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = "info") => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4500);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    // Check service health & latencies
    const checkHealth = useCallback(async () => {
        try {
            const s1 = await donationService.getHealth();
            setSvc1Status({
                healthy: s1.status === "healthy",
                latencyMs: s1.latencyMs || 24,
                database: s1.database || "connected",
                loading: false
            });
        } catch {
            setSvc1Status({
                healthy: false,
                latencyMs: 0,
                database: "unreachable",
                loading: false
            });
        }

        try {
            const s2 = await requestService.getHealth();
            setSvc2Status({
                healthy: s2.status === "healthy",
                latencyMs: s2.latencyMs || 18,
                database: s2.database || "connected",
                loading: false
            });
        } catch {
            setSvc2Status({
                healthy: false,
                latencyMs: 0,
                database: "unreachable",
                loading: false
            });
        }
    }, []);

    // Fetch user notifications
    const fetchNotifications = useCallback(async () => {
        const token = localStorage.getItem("foodrescue_token");
        if (!token) {
            setNotifications([]);
            setUnreadCount(0);
            return;
        }

        try {
            const unread = await notificationService.getUnreadCount();
            setUnreadCount(unread);
            const notifs = await notificationService.getNotifications();
            setNotifications(notifs || []);
            setCounts(prev => ({ ...prev, unreadNotifications: unread }));
        } catch (err) {
            // Ignore if unauthenticated
        }
    }, []);

    // Refresh platform data
    const refreshData = useCallback(async () => {
        await checkHealth();
        await fetchNotifications();

        try {
            const donStats = await donationService.getStats();
            const reqStats = await requestService.getStats();
            const logs = await requestService.getEventLogs();

            const totalMeals = 1485 + (donStats.totalMealsRescued || 0);
            const activeDon = donStats.availableDonations ?? 0;
            const openReq = reqStats.pendingRequests ?? 0;
            const co2Kg = 3712 + (donStats.co2WastePreventedKg || 0);

            setStats({
                totalMealsRescued: totalMeals,
                activeDonations: activeDon,
                openNgoRequests: openReq,
                co2WastePreventedKg: co2Kg
            });

            setCounts(prev => ({
                ...prev,
                donations: donStats.totalDonations || 0,
                requests: reqStats.totalRequests || 0,
                pendingIncoming: reqStats.pendingRequests || 0
            }));

            if (logs && logs.length > 0) {
                setEventLogs(logs);
            }
        } catch (err) {
            console.warn("Could not fetch latest stats:", err.message);
        }
    }, [checkHealth, fetchNotifications]);

    // Initial mount & periodic refresh every 10 seconds
    useEffect(() => {
        refreshData();
        const interval = setInterval(refreshData, 10000);
        return () => clearInterval(interval);
    }, [refreshData]);

    const openRequestModalForDonation = (donation) => {
        setSelectedDonationForRequest(donation);
        setIsRequestModalOpen(true);
    };

    const openRequestsForDonation = (donation) => {
        setSelectedDonationForRequestsView(donation);
        setIsViewRequestsModalOpen(true);
    };

    const openAuthModal = (mode = "login", role = "supplier") => {
        setAuthModalMode(mode);
        setAuthInitialRole(role);
        setIsAuthModalOpen(true);
    };

    return (
        <AppContext.Provider
            value={{
                activeTab,
                setActiveTab,
                viewMode,
                setViewMode,
                svc1Status,
                svc2Status,
                stats,
                counts,
                feedItems,
                eventLogs,
                refreshData,
                notifications,
                unreadCount,
                fetchNotifications,
                isDonationModalOpen,
                setIsDonationModalOpen,
                isRequestModalOpen,
                setIsRequestModalOpen,
                selectedDonationForRequest,
                setSelectedDonationForRequest,
                openRequestModalForDonation,
                selectedDonationForRequestsView,
                setSelectedDonationForRequestsView,
                openRequestsForDonation,
                isViewRequestsModalOpen,
                setIsViewRequestsModalOpen,
                isProfileModalOpen,
                setIsProfileModalOpen,
                isAuthModalOpen,
                setIsAuthModalOpen,
                authModalMode,
                setAuthModalMode,
                authInitialRole,
                setAuthInitialRole,
                openAuthModal,
                toasts,
                addToast,
                removeToast
            }}
        >
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => useContext(AppContext);
export default AppContext;
