import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import requestService from "../services/requestService";
import { Search, Plus, Sparkles, CheckCircle2, Clock, XCircle, Trash2, MapPin, Building, Calendar, Phone } from "lucide-react";
import NativeDialerButton from "./NativeDialerButton";

export const RequestsTab = () => {
    const { setActiveTab, refreshData, addToast } = useApp();
    const { user } = useAuth();

    const [requests, setRequests] = useState([]);
    const [statusFilter, setStatusFilter] = useState("All");
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadRequests();
    }, [statusFilter, user]);

    const loadRequests = async () => {
        setLoading(true);
        try {
            const params = {};
            if (statusFilter !== "All") params.status = statusFilter;
            const data = await requestService.getRequests(params);
            setRequests(data || []);
        } catch (err) {
            console.error("Failed to load requests:", err);
            addToast("Failed to fetch requests from Service 2", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (id, title) => {
        if (!window.confirm(`Are you sure you want to cancel request for "${title}"?`)) return;
        try {
            await requestService.cancelRequest(id);
            addToast(`Request cancelled. Any reserved quantity has been released.`, "info");
            await loadRequests();
            await refreshData();
        } catch (err) {
            addToast(err.response?.data?.message || "Failed to cancel request", "error");
        }
    };

    const handleFulfill = async (id, title) => {
        try {
            await requestService.fulfillRequest(id);
            addToast(`Request for "${title}" marked as Fulfilled and collected!`, "success");
            await loadRequests();
            await refreshData();
        } catch (err) {
            addToast(err.response?.data?.message || "Failed to fulfill request", "error");
        }
    };

    const filteredRequests = requests.filter(r => {
        if (!searchTerm) return true;
        const s = searchTerm.toLowerCase();
        return (
            r.foodName?.toLowerCase().includes(s) ||
            r.supplierName?.toLowerCase().includes(s) ||
            r.location?.toLowerCase().includes(s)
        );
    });

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
            case "Cancelled":
                return <span className="status-tag" style={{ background: "#f1f5f9", color: "#64748b" }}><XCircle size={11} /> Cancelled</span>;
            default:
                return <span className="status-tag">{status}</span>;
        }
    };

    return (
        <div className="data-panel-card" id="my-requests-management-view">
            {/* Filter Bar */}
            <div className="filter-bar">
                <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                    <div className="search-input-wrap">
                        <Search size={16} className="search-icon" />
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Search requests by food or supplier..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="filter-pills-row">
                        {["All", "Pending", "Accepted", "Rejected", "Fulfilled", "Cancelled"].map((st) => (
                            <button
                                key={st}
                                className={`filter-pill ${statusFilter === st ? "active" : ""}`}
                                onClick={() => setStatusFilter(st)}
                            >
                                {st}
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    id="btn-browse-more-food"
                    className="btn-publish-orange"
                    style={{ padding: "8px 18px", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}
                    onClick={() => setActiveTab("browse-food")}
                >
                    <Plus size={16} />
                    <span>Browse & Request Food</span>
                </button>
            </div>

            {/* Table / List */}
            <div className="table-responsive">
                <table className="custom-table" id="my-requests-table">
                    <thead>
                        <tr>
                            <th>Requested Food Item</th>
                            <th>Supplier / Donor</th>
                            <th>Quantity</th>
                            <th>Delivery Location</th>
                            <th>Needed By</th>
                            <th>Status & Decision</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={7} style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
                                    Loading your submitted requests from Service 2...
                                </td>
                            </tr>
                        ) : filteredRequests.length > 0 ? (
                            filteredRequests.map((item) => (
                                <tr key={item._id}>
                                    <td>
                                        <div style={{ fontWeight: "700", color: "#0f172a" }}>
                                            {item.foodName || item.foodCategory}
                                        </div>
                                        <div style={{ fontSize: "11px", color: "#64748b" }}>
                                            REQ-#{item._id.slice(-4).toUpperCase()} • For {item.peopleCount} people
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: "600", color: "#0f172a" }}>
                                            {item.supplierName || "Commercial Donor"}
                                        </div>
                                        {item.matchedDonationDetails?.contactPhone && (
                                            <div style={{ marginTop: "4px" }}>
                                                <NativeDialerButton
                                                    phoneNumber={item.matchedDonationDetails.contactPhone}
                                                    label="Call Donor"
                                                    showNumber={true}
                                                    size="sm"
                                                    variant="success"
                                                    id={`btn-call-donor-req-${item._id}`}
                                                    showCopy={true}
                                                />
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        <span style={{ fontWeight: "700", color: "#ea580c" }}>{item.quantity}</span> {item.unit}
                                    </td>
                                    <td>
                                        <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px" }}>
                                            <MapPin size={12} style={{ color: "#64748b" }} />
                                            <span>{item.location}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontSize: "12px" }}>
                                            {new Date(item.neededBy).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                            {getStatusBadge(item.status)}
                                            {item.status === "Accepted" && item.pickupInstructions && (
                                                <div style={{ fontSize: "11px", color: "#047857" }}>
                                                    <strong>Pickup:</strong> {item.pickupInstructions}
                                                </div>
                                            )}
                                            {item.status === "Rejected" && item.rejectionReason && (
                                                <div style={{ fontSize: "11px", color: "#b91c1c" }}>
                                                    Reason: {item.rejectionReason}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="action-btn-group" style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                                            {item.status === "Accepted" && item.matchedDonationDetails?.contactPhone && (
                                                <NativeDialerButton
                                                    phoneNumber={item.matchedDonationDetails.contactPhone}
                                                    label="Call Donor"
                                                    size="sm"
                                                    variant="primary"
                                                    id={`btn-call-donor-action-${item._id}`}
                                                />
                                            )}

                                            {item.status === "Accepted" && (
                                                <button
                                                    className="btn-table-action primary"
                                                    style={{ background: "#7e22ce", borderColor: "#7e22ce" }}
                                                    title="Confirm Received & Collected"
                                                    onClick={() => handleFulfill(item._id, item.foodName)}
                                                >
                                                    Mark Collected
                                                </button>
                                            )}

                                            {item.status === "Pending" && (
                                                <button
                                                    className="btn-table-action danger"
                                                    title="Cancel Request"
                                                    onClick={() => handleCancel(item._id, item.foodName)}
                                                >
                                                    Cancel
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={7} style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                                    No requests found in this view. Click <strong>Browse & Request Food</strong> to find available surplus food!
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default RequestsTab;
