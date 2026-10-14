import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import donationService from "../services/donationService";
import { Search, Plus, Trash2, CheckCircle2, Clock, AlertTriangle, Inbox, MapPin, Phone } from "lucide-react";

export const DonationsTab = () => {
    const { setIsDonationModalOpen, openRequestsForDonation, setActiveTab, setSelectedDonationForRequestsView, refreshData, addToast } = useApp();
    const { user } = useAuth();

    const [donations, setDonations] = useState([]);
    const [statusFilter, setStatusFilter] = useState("All");
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);

    const isSupplier = user?.role === "supplier";

    useEffect(() => {
        loadDonations();
    }, [statusFilter, user]);

    const loadDonations = async () => {
        setLoading(true);
        try {
            const params = {};
            if (statusFilter !== "All") params.status = statusFilter;
            if (isSupplier && user?.id) {
                params.supplierId = user.id;
            }
            const data = await donationService.getDonations(params);
            setDonations(data || []);
        } catch (err) {
            console.error("Failed to load donations:", err);
            addToast("Failed to fetch donations from Service 1", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id, foodName) => {
        if (!window.confirm(`Are you sure you want to delete donation "${foodName}"?`)) return;
        try {
            await donationService.deleteDonation(id);
            addToast(`Donation "${foodName}" deleted successfully`, "success");
            await loadDonations();
            await refreshData();
        } catch (err) {
            addToast(err.response?.data?.message || "Failed to delete donation", "error");
        }
    };

    const handleViewRequests = (donation) => {
        setSelectedDonationForRequestsView(donation);
        setActiveTab("incoming-requests");
    };

    const filteredDonations = donations.filter(d => {
        if (!searchTerm) return true;
        const s = searchTerm.toLowerCase();
        return (
            d.foodName?.toLowerCase().includes(s) ||
            d.donorName?.toLowerCase().includes(s) ||
            d.location?.toLowerCase().includes(s) ||
            d.category?.toLowerCase().includes(s)
        );
    });

    const getStatusBadge = (status, avail, total, unit) => {
        switch (status) {
            case "Available":
                return <span className="status-tag ready"><CheckCircle2 size={11} /> Available ({avail}/{total} {unit})</span>;
            case "Partially Reserved":
                return <span className="status-tag en-route" style={{ background: "#fef3c7", color: "#b45309" }}><Clock size={11} /> Partial ({avail}/{total} {unit})</span>;
            case "Reserved":
                return <span className="status-tag en-route" style={{ background: "#fef3c7", color: "#b45309" }}><Clock size={11} /> Fully Reserved</span>;
            case "Collected":
                return <span className="status-tag fulfilled"><CheckCircle2 size={11} /> Collected</span>;
            case "Expired":
                return <span className="status-tag" style={{ background: "#fee2e2", color: "#b91c1c" }}><AlertTriangle size={11} /> Expired</span>;
            default:
                return <span className="status-tag">{status}</span>;
        }
    };

    return (
        <div className="data-panel-card" id="donations-management-view">
            {/* Header / Actions */}
            <div className="filter-bar">
                <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                    <div className="search-input-wrap">
                        <Search size={16} className="search-icon" />
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Search food, menu, or location..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="filter-pills-row">
                        {["All", "Available", "Partially Reserved", "Reserved", "Collected", "Expired"].map((st) => (
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

                {/* Post Food Donation Button */}
                <button
                    id="btn-post-new-donation"
                    className="btn-publish-green"
                    style={{ padding: "8px 18px", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}
                    onClick={() => setIsDonationModalOpen(true)}
                >
                    <Plus size={16} />
                    <span>Post Food Donation</span>
                </button>
            </div>

            {/* Table */}
            <div className="table-responsive">
                <table className="custom-table" id="donations-table">
                    <thead>
                        <tr>
                            <th>Food Item & Menu</th>
                            <th>Donor / Organization</th>
                            <th>Quantity (Available / Total)</th>
                            <th>Pickup Location</th>
                            <th>Expiry</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={7} style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
                                    Loading donations from Service 1 (:5001)...
                                </td>
                            </tr>
                        ) : filteredDonations.length > 0 ? (
                            filteredDonations.map((item) => {
                                const avail = item.availableQuantity !== undefined ? item.availableQuantity : item.quantity;

                                return (
                                    <tr key={item._id}>
                                        <td>
                                            <div style={{ fontWeight: "700", color: "#0f172a" }}>{item.foodName}</div>
                                            <div style={{ fontSize: "11px", color: "#64748b" }}>
                                                {item.category} • <span style={{ color: "#059669" }}>{item.dietaryTag}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: "600" }}>{item.donorName}</div>
                                            <div style={{ fontSize: "11px", color: "#64748b" }}>{item.donorType}</div>
                                        </td>
                                        <td>
                                            <span style={{ fontWeight: "800", color: "#00b87c" }}>{avail}</span>
                                            <span style={{ color: "#64748b" }}> / {item.quantity} {item.unit}</span>
                                        </td>
                                        <td>
                                            <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px" }}>
                                                <MapPin size={12} style={{ color: "#64748b" }} />
                                                <span>{item.location}</span>
                                            </div>
                                            {item.contactPhone && (
                                                <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#059669", marginTop: "3px" }}>
                                                    <Phone size={11} />
                                                    <span>{item.contactPhone}</span>
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <div style={{ fontSize: "12px" }}>
                                                {new Date(item.expiryTime).toLocaleDateString()}{" "}
                                                {new Date(item.expiryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>
                                        <td>
                                            {getStatusBadge(item.status, avail, item.quantity, item.unit)}
                                        </td>
                                        <td>
                                            <div className="action-btn-group">
                                                {/* View Requests Button */}
                                                <button
                                                    id={`btn-view-requests-${item._id}`}
                                                    className="btn-table-action"
                                                    style={{ background: "#e0f2fe", color: "#0369a1", borderColor: "#bae6fd", display: "flex", alignItems: "center", gap: "4px" }}
                                                    title="View Requests for this Donation"
                                                    onClick={() => handleViewRequests(item)}
                                                >
                                                    <Inbox size={12} />
                                                    <span>View Requests</span>
                                                </button>

                                                <button
                                                    className="btn-table-action danger"
                                                    title="Delete Donation"
                                                    onClick={() => handleDelete(item._id, item.foodName)}
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={7} style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                                    No donations found. Click <strong>Post Food Donation</strong> to register surplus food!
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DonationsTab;
