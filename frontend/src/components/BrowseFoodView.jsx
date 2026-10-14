import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import donationService from "../services/donationService";
import { Search, Heart, MapPin, Clock, Building, Plus, ArrowRight, Utensils, CheckCircle2, Phone } from "lucide-react";
import NativeDialerButton from "./NativeDialerButton";

export const BrowseFoodView = () => {
    const { openRequestModalForDonation, addToast, activeTab } = useApp();
    const { isAuthenticated, user, openAuthModal } = useAuth();

    const [donations, setDonations] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAvailableDonations();
    }, [activeTab]);

    const loadAvailableDonations = async () => {
        setLoading(true);
        try {
            const data = await donationService.getAvailableDonations();
            setDonations(data || []);
        } catch (err) {
            console.error("Failed to load available donations:", err);
            addToast("Failed to load available surplus food", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleRequestClick = (item) => {
        if (!isAuthenticated) {
            addToast("Please sign in as a Food Requester to request surplus food.", "info");
            return;
        }
        if (user?.role === "supplier") {
            addToast("Suppliers cannot submit requests for food. Please switch to a Requester account.", "error");
            return;
        }
        openRequestModalForDonation(item);
    };

    const categories = ["All", "Cooked Food", "Fruits", "Vegetables", "Bakery", "Packaged Food", "Other"];

    const filteredDonations = donations.filter(d => {
        // Strict availability filter: exclude reserved, collected, expired, or 0-quantity donations
        if (d.status === "Reserved" || d.status === "Collected" || d.status === "Expired") return false;
        const avail = d.availableQuantity !== undefined ? d.availableQuantity : d.quantity;
        if (avail <= 0) return false;
        if (d.expiryTime && new Date(d.expiryTime) <= new Date()) return false;

        const matchesCategory = selectedCategory === "All" || d.category === selectedCategory;
        if (!matchesCategory) return false;

        if (!searchTerm) return true;
        const s = searchTerm.toLowerCase();
        return (
            d.foodName?.toLowerCase().includes(s) ||
            d.donorName?.toLowerCase().includes(s) ||
            d.location?.toLowerCase().includes(s)
        );
    });

    return (
        <div className="data-panel-card" id="browse-food-view">
            {/* Header */}
            <div className="panel-header" style={{ marginBottom: "20px" }}>
                <div className="panel-title-group">
                    <h2 style={{ fontSize: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
                        <Utensils size={22} style={{ color: "#ea580c" }} />
                        <span>Available Surplus Food Donations</span>
                    </h2>
                    <p className="panel-subtitle">
                        Direct surplus food donations from commercial caterers, hotels, and restaurants awaiting local claim
                    </p>
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="filter-bar" style={{ marginBottom: "24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap", width: "100%" }}>
                    <div className="search-input-wrap" style={{ flex: 1, minWidth: "260px" }}>
                        <Search size={16} className="search-icon" />
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Search available meals, donor, or location..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="filter-pills-row">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                className={`filter-pill ${selectedCategory === cat ? "active" : ""}`}
                                onClick={() => setSelectedCategory(cat)}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Grid of Food Cards */}
            {loading ? (
                <div style={{ textAlign: "center", padding: "60px", color: "#64748b" }}>
                    <p>Loading available food donations from Service 1...</p>
                </div>
            ) : filteredDonations.length > 0 ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
                    {filteredDonations.map((item) => {
                        const available = item.availableQuantity !== undefined ? item.availableQuantity : item.quantity;
                        const expiryDate = new Date(item.expiryTime);

                        return (
                            <div
                                key={item._id}
                                id={`food-card-${item._id}`}
                                style={{
                                    border: "1px solid #e2e8f0",
                                    borderRadius: "16px",
                                    padding: "20px",
                                    background: "#ffffff",
                                    boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "space-between",
                                    transition: "transform 0.15s ease, box-shadow 0.15s ease"
                                }}
                            >
                                <div>
                                    {/* Top badges */}
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                                        <span className="match-code-badge" style={{ background: "#e6f9f2", color: "#047857" }}>
                                            {item.category}
                                        </span>
                                        <span className="status-tag ready">
                                            <CheckCircle2 size={11} /> {available} {item.unit} Available
                                        </span>
                                    </div>

                                    {/* Food Name */}
                                    <h3 style={{ fontSize: "17px", fontWeight: "800", color: "#0f172a", marginBottom: "6px" }}>
                                        {item.foodName}
                                    </h3>

                                    {/* Dietary Tag */}
                                    <div style={{ marginBottom: "14px" }}>
                                        <span style={{ fontSize: "12px", fontWeight: "600", color: "#059669", background: "#f0fdf4", padding: "3px 8px", borderRadius: "6px" }}>
                                            ✦ {item.dietaryTag}
                                        </span>
                                    </div>

                                    {/* Donor info */}
                                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px", color: "#475569", borderTop: "1px solid #f1f5f9", paddingTop: "12px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                            <Building size={14} style={{ color: "#00b87c", flexShrink: 0 }} />
                                            <span><strong>Donor:</strong> {item.donorName} ({item.donorType || "Commercial"})</span>
                                        </div>

                                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                            <MapPin size={14} style={{ color: "#ea580c", flexShrink: 0 }} />
                                            <span><strong>Pickup:</strong> {item.location}</span>
                                        </div>

                                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                            <Clock size={14} style={{ color: "#64748b", flexShrink: 0 }} />
                                            <span><strong>Expires:</strong> {expiryDate.toLocaleDateString()} {expiryDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>

                                        {item.contactPhone && (
                                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "2px", paddingTop: "6px", borderTop: "1px dashed #e2e8f0" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                    <Phone size={13} style={{ color: "#00b87c", flexShrink: 0 }} />
                                                    <span><strong>Phone:</strong> {item.contactPhone}</span>
                                                </div>
                                                <NativeDialerButton
                                                    phoneNumber={item.contactPhone}
                                                    label="Call Donor"
                                                    size="sm"
                                                    variant="success"
                                                    id={`btn-call-donor-${item._id}`}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {item.description && (
                                        <p style={{ fontSize: "12px", color: "#64748b", marginTop: "10px", fontStyle: "italic" }}>
                                            "{item.description}"
                                        </p>
                                    )}
                                </div>

                                {/* Request Button */}
                                <div style={{ marginTop: "18px", paddingTop: "14px", borderTop: "1px solid #f1f5f9" }}>
                                    <button
                                        id={`btn-request-food-${item._id}`}
                                        className="btn-publish-orange"
                                        style={{ width: "100%", justifyContent: "center", display: "flex", alignItems: "center", gap: "8px", padding: "10px" }}
                                        onClick={() => handleRequestClick(item)}
                                    >
                                        <Utensils size={15} />
                                        <span>Request This Food</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div style={{ textAlign: "center", padding: "60px 20px", color: "#64748b" }}>
                    <Utensils size={40} style={{ margin: "0 auto 12px auto", opacity: 0.4 }} />
                    <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a" }}>No Surplus Food Available</h3>
                    <p style={{ fontSize: "13px", marginTop: "4px" }}>
                        Check back soon! When restaurants and caterers post surplus donations, they will appear here immediately.
                    </p>
                </div>
            )}
        </div>
    );
};

export default BrowseFoodView;
