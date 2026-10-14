import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import requestService from "../services/requestService";
import { Sparkles, X, Check, AlertCircle, Building, MapPin, Calendar, Clock, ArrowRight } from "lucide-react";

export const MatchReserveModal = () => {
    const {
        isMatchModalOpen,
        setIsMatchModalOpen,
        selectedRequestForMatch,
        refreshData,
        addToast
    } = useApp();

    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [reservingId, setReservingId] = useState(null);

    useEffect(() => {
        if (isMatchModalOpen && selectedRequestForMatch?._id) {
            fetchMatches(selectedRequestForMatch._id);
        }
    }, [isMatchModalOpen, selectedRequestForMatch]);

    const fetchMatches = async (reqId) => {
        setLoading(true);
        try {
            const data = await requestService.getMatches(reqId);
            setMatches(data.matches || []);
        } catch (err) {
            console.error("Failed to fetch matches:", err);
            addToast(
                err.response?.data?.message || "Could not retrieve matches. Ensure Service 1 is active on port 5001.",
                "error"
            );
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptMatch = async (donationId) => {
        if (!selectedRequestForMatch?._id) return;
        setReservingId(donationId);

        try {
            const res = await requestService.acceptMatch(selectedRequestForMatch._id, donationId);
            addToast(res.message || "Match accepted and donation reserved safely!", "success");
            setIsMatchModalOpen(false);
            await refreshData();
        } catch (err) {
            console.error("Failed to accept match:", err);
            addToast(
                err.response?.data?.message || "Reservation failed. Donation may have already been reserved or expired.",
                "error"
            );
        } finally {
            setReservingId(null);
        }
    };

    if (!isMatchModalOpen || !selectedRequestForMatch) return null;

    return (
        <div className="modal-backdrop" onClick={() => setIsMatchModalOpen(false)} role="dialog" aria-modal="true">
            <div className="modal-card" style={{ maxWidth: "680px" }} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="modal-header">
                    <div className="modal-title-wrap">
                        <div className="modal-header-icon orange">
                            <Sparkles size={24} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="modal-title">Algorithmic Proximity Matches</h2>
                            <p style={{ fontSize: "12px", color: "#64748b" }}>
                                Request #{selectedRequestForMatch._id.slice(-6)} • {selectedRequestForMatch.organizationName || selectedRequestForMatch.requesterName} ({selectedRequestForMatch.quantity} {selectedRequestForMatch.unit} {selectedRequestForMatch.foodCategory})
                            </p>
                        </div>
                    </div>
                    <button
                        className="modal-close-btn"
                        onClick={() => setIsMatchModalOpen(false)}
                        aria-label="Close modal"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Match Candidates List */}
                <div style={{ marginTop: "16px" }}>
                    {loading ? (
                        <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                            <p>Scanning Service 1 surplus registry for compatible food...</p>
                        </div>
                    ) : matches.length > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                            {matches.map((item) => (
                                <div
                                    key={item._id}
                                    style={{
                                        border: "1.5px solid #e2e8f0",
                                        borderRadius: "12px",
                                        padding: "16px",
                                        background: "#ffffff",
                                        boxShadow: "0 2px 6px rgba(0,0,0,0.03)"
                                    }}
                                >
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            <span style={{ fontWeight: "700", fontSize: "15px", color: "#0f172a" }}>
                                                {item.foodName}
                                            </span>
                                            <span className="compatibility-pill">
                                                <Sparkles size={11} />
                                                <span>{item.compatibilityScore}% Compatibility</span>
                                            </span>
                                        </div>

                                        <button
                                            className="btn-publish-green"
                                            style={{ padding: "8px 16px", fontSize: "13px" }}
                                            disabled={reservingId === item._id}
                                            onClick={() => handleAcceptMatch(item._id)}
                                        >
                                            {reservingId === item._id ? "Reserving..." : "Accept & Reserve"}
                                        </button>
                                    </div>

                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "12px", color: "#475569" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                            <Building size={13} style={{ color: "#00b87c" }} />
                                            <span><strong>Donor:</strong> {item.donorName} ({item.donorType || "Partner"})</span>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                            <MapPin size={13} style={{ color: "#ea580c" }} />
                                            <span><strong>Location:</strong> {item.location}</span>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                            <span><strong>Available:</strong> {item.quantity} {item.unit}</span>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                            <Clock size={13} />
                                            <span><strong>Expires:</strong> {new Date(item.expiryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                            <AlertCircle size={32} style={{ margin: "0 auto 10px auto", opacity: 0.5 }} />
                            <p style={{ fontWeight: "600" }}>No available donations match this request right now.</p>
                            <p style={{ fontSize: "12px", marginTop: "4px" }}>
                                As soon as a supplier posts surplus food in this category or region, it will automatically appear here!
                            </p>
                        </div>
                    )}
                </div>

                <div className="modal-footer" style={{ marginTop: "20px" }}>
                    <button
                        type="button"
                        className="btn-cancel"
                        onClick={() => setIsMatchModalOpen(false)}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MatchReserveModal;
