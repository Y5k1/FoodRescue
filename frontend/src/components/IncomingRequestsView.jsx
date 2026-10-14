import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import requestService from "../services/requestService";
import { Inbox, CheckCircle2, XCircle, Clock, Users, MapPin, Calendar, Check, X, AlertTriangle, Phone } from "lucide-react";
import NativeDialerButton from "./NativeDialerButton";

export const IncomingRequestsView = ({ donationId = null, donationTitle = null }) => {
    const { refreshData, addToast } = useApp();
    const { user } = useAuth();

    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoadingId, setActionLoadingId] = useState(null);
    const [decisionNoteModal, setDecisionNoteModal] = useState({ open: false, type: null, requestId: null, text: "" });
    const activeModalReq = requests.find(r => r._id === decisionNoteModal.requestId);

    useEffect(() => {
        loadRequests();
    }, [donationId]);

    const loadRequests = async () => {
        setLoading(true);
        try {
            const params = {};
            if (donationId) params.donationId = donationId;
            const data = await requestService.getRequests(params);
            setRequests(data || []);
        } catch (err) {
            console.error("Failed to load incoming requests:", err);
            addToast("Failed to load incoming requests", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (id, pickupInstructions) => {
        setActionLoadingId(id);
        try {
            const res = await requestService.acceptRequest(id, {
                pickupInstructions: pickupInstructions || "Pickup ready at donor location during business hours."
            });
            addToast(res.message || "Request accepted and quantity reserved!", "success");
            await loadRequests();
            await refreshData();
        } catch (err) {
            console.error("Accept request failed:", err);
            addToast(
                err.response?.data?.message || "Failed to accept request. Insufficient quantity or expired.",
                "error"
            );
        } finally {
            setActionLoadingId(null);
            setDecisionNoteModal({ open: false, type: null, requestId: null, text: "" });
        }
    };

    const handleReject = async (id, rejectionReason) => {
        setActionLoadingId(id);
        try {
            const res = await requestService.rejectRequest(id, {
                rejectionReason: rejectionReason || "Unavailable or capacity reached"
            });
            addToast(res.message || "Request rejected.", "info");
            await loadRequests();
            await refreshData();
        } catch (err) {
            console.error("Reject request failed:", err);
            addToast(err.response?.data?.message || "Failed to reject request", "error");
        } finally {
            setActionLoadingId(null);
            setDecisionNoteModal({ open: false, type: null, requestId: null, text: "" });
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case "Pending":
                return <span className="status-tag ready"><Clock size={11} /> Pending Review</span>;
            case "Accepted":
                return <span className="status-tag en-route" style={{ background: "#dcfce7", color: "#15803d" }}><CheckCircle2 size={11} /> Accepted</span>;
            case "Rejected":
                return <span className="status-tag" style={{ background: "#fee2e2", color: "#b91c1c" }}><XCircle size={11} /> Rejected</span>;
            case "Fulfilled":
                return <span className="status-tag fulfilled"><CheckCircle2 size={11} /> Fulfilled</span>;
            default:
                return <span className="status-tag">{status}</span>;
        }
    };

    return (
        <div className="data-panel-card" id="incoming-requests-view">
            {/* Header */}
            <div className="panel-header" style={{ marginBottom: "20px" }}>
                <div className="panel-title-group">
                    <h2 style={{ fontSize: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
                        <Inbox size={22} style={{ color: "#00b87c" }} />
                        <span>{donationTitle ? `Requests for "${donationTitle}"` : "Incoming Food Requests"}</span>
                    </h2>
                    <p className="panel-subtitle">
                        Review community kitchen and shelter requests submitted for your surplus food donations
                    </p>
                </div>
            </div>

            {/* Requests List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {loading ? (
                    <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                        <p>Loading incoming requests from Service 2...</p>
                    </div>
                ) : requests.length > 0 ? (
                    requests.map((item) => (
                        <div
                            key={item._id}
                            id={`request-card-${item._id}`}
                            style={{
                                border: "1px solid #e2e8f0",
                                borderRadius: "14px",
                                padding: "20px",
                                background: "#ffffff",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                                display: "flex",
                                flexDirection: "column",
                                gap: "12px"
                            }}
                        >
                            {/* Card Top Row */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
                                <div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <span style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>
                                            {item.requesterName}
                                        </span>
                                        {item.organizationName && (
                                            <span style={{ fontSize: "13px", fontWeight: "600", color: "#059669" }}>
                                                • {item.organizationName}
                                            </span>
                                        )}
                                        <span className="match-code-badge" style={{ fontSize: "11px" }}>
                                            REQ-#{item._id.slice(-4).toUpperCase()}
                                        </span>
                                    </div>
                                    <span style={{ fontSize: "12px", color: "#64748b" }}>
                                        Submitted {new Date(item.submissionTimestamp || item.createdAt).toLocaleDateString()} at{" "}
                                        {new Date(item.submissionTimestamp || item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>

                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                    {getStatusBadge(item.status)}
                                </div>
                            </div>

                            {/* Card Details Grid */}
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", background: "#f8fafc", padding: "14px", borderRadius: "10px", fontSize: "13px" }}>
                                <div>
                                    <div style={{ color: "#64748b", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>Requested Item</div>
                                    <div style={{ fontWeight: "700", color: "#0f172a" }}>{item.foodName}</div>
                                    <div style={{ fontSize: "12px", color: "#059669" }}>{item.quantity} {item.unit}</div>
                                </div>

                                <div>
                                    <div style={{ color: "#64748b", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>Requester Location</div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#334155" }}>
                                        <MapPin size={13} style={{ color: "#ea580c" }} />
                                        <span>{item.location}</span>
                                    </div>
                                    {item.contactPhone && (
                                        <div style={{ marginTop: "6px" }}>
                                            <NativeDialerButton
                                                phoneNumber={item.contactPhone}
                                                label="Call"
                                                showNumber={true}
                                                size="sm"
                                                variant="success"
                                                id={`tel-call-requester-${item._id}`}
                                            />
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <div style={{ color: "#64748b", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>Beneficiaries</div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#334155" }}>
                                        <Users size={13} style={{ color: "#3b82f6" }} />
                                        <span><strong>{item.peopleCount}</strong> people</span>
                                    </div>
                                </div>

                                <div>
                                    <div style={{ color: "#64748b", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>Required By</div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#334155" }}>
                                        <Calendar size={13} style={{ color: "#64748b" }} />
                                        <span>{new Date(item.neededBy).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Additional description message */}
                            {item.description && (
                                <div style={{ fontSize: "13px", color: "#475569", background: "#ffffff", padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
                                    <span style={{ fontWeight: "700", color: "#0f172a" }}>Message: </span>
                                    {item.description}
                                </div>
                            )}

                            {/* Acceptance instructions note if accepted */}
                            {item.status === "Accepted" && item.pickupInstructions && (
                                <div style={{ fontSize: "12px", color: "#166534", background: "#f0fdf4", padding: "8px 12px", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
                                    <strong>Pickup Coordinates:</strong> {item.pickupInstructions}
                                </div>
                            )}

                            {/* Action Bar: Direct Native Dialing & Decision Actions */}
                            <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "10px", marginTop: "8px", flexWrap: "wrap" }}>
                                {item.contactPhone && (
                                    <NativeDialerButton
                                        phoneNumber={item.contactPhone}
                                        label="Call Requester"
                                        size="md"
                                        variant="primary"
                                        id={`btn-call-req-action-${item._id}`}
                                        style={{ padding: "8px 16px" }}
                                    />
                                )}

                                {item.status === "Pending" && (
                                    <>
                                        <button
                                            id={`btn-reject-req-${item._id}`}
                                            className="btn-table-action danger"
                                            style={{ padding: "8px 16px", display: "flex", alignItems: "center", gap: "6px" }}
                                            disabled={actionLoadingId === item._id}
                                            onClick={() => setDecisionNoteModal({ open: true, type: "reject", requestId: item._id, text: "" })}
                                        >
                                            <X size={14} />
                                            <span>Reject Request</span>
                                        </button>

                                        <button
                                            id={`btn-accept-req-${item._id}`}
                                            className="btn-publish-green"
                                            style={{ padding: "8px 20px", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}
                                            disabled={actionLoadingId === item._id}
                                            onClick={() => setDecisionNoteModal({ open: true, type: "accept", requestId: item._id, text: "" })}
                                        >
                                            <Check size={14} strokeWidth={2.5} />
                                            <span>{actionLoadingId === item._id ? "Reserving..." : "Accept & Reserve"}</span>
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div style={{ textAlign: "center", padding: "60px 20px", color: "#64748b" }}>
                        <Inbox size={40} style={{ margin: "0 auto 12px auto", opacity: 0.4 }} />
                        <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a" }}>No Incoming Requests</h3>
                        <p style={{ fontSize: "13px", marginTop: "4px" }}>
                            Requests submitted by shelters and community kitchens for your surplus donations will appear here.
                        </p>
                    </div>
                )}
            </div>

            {/* Accept / Reject Instruction Dialog */}
            {decisionNoteModal.open && (
                <div className="modal-backdrop" onClick={() => setDecisionNoteModal({ open: false, type: null, requestId: null, text: "" })}>
                    <div className="modal-card" style={{ maxWidth: "480px" }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                {decisionNoteModal.type === "accept" ? "Accept Food Request" : "Reject Food Request"}
                            </h3>
                        </div>

                        {activeModalReq?.contactPhone && (
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "10px 14px", borderRadius: "8px", marginBottom: "14px" }}>
                                <div>
                                    <div style={{ fontWeight: "700", color: "#166534", fontSize: "13px" }}>{activeModalReq.requesterName}</div>
                                    <div style={{ color: "#15803d", fontSize: "12px" }}>
                                        {activeModalReq.organizationName || "Requester"} • <strong>{activeModalReq.contactPhone}</strong>
                                    </div>
                                </div>
                                <NativeDialerButton
                                    phoneNumber={activeModalReq.contactPhone}
                                    label="Call Requester"
                                    size="sm"
                                    variant="success"
                                    id={`modal-call-req-${activeModalReq._id}`}
                                    showCopy={true}
                                />
                            </div>
                        )}

                        <div className="form-group">
                            <label className="form-label">
                                {decisionNoteModal.type === "accept"
                                    ? "Pickup / Collection Instructions (Optional)"
                                    : "Reason for Rejection"}
                            </label>
                            <textarea
                                className="form-textarea"
                                rows="3"
                                placeholder={
                                    decisionNoteModal.type === "accept"
                                        ? "e.g., Please pickup at the back kitchen dock between 2 PM and 4 PM."
                                        : "e.g., Capacity already committed or pickup window unavailable."
                                }
                                value={decisionNoteModal.text}
                                onChange={(e) => setDecisionNoteModal(prev => ({ ...prev, text: e.target.value }))}
                            />
                        </div>

                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn-cancel"
                                onClick={() => setDecisionNoteModal({ open: false, type: null, requestId: null, text: "" })}
                            >
                                Cancel
                            </button>
                            {decisionNoteModal.type === "accept" ? (
                                <button
                                    type="button"
                                    className="btn-publish-green"
                                    onClick={() => handleAccept(decisionNoteModal.requestId, decisionNoteModal.text)}
                                >
                                    Confirm Acceptance
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    className="btn-publish-orange"
                                    style={{ background: "#dc2626" }}
                                    onClick={() => handleReject(decisionNoteModal.requestId, decisionNoteModal.text)}
                                >
                                    Confirm Rejection
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default IncomingRequestsView;
