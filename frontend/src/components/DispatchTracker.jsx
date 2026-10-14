import React from "react";
import { useApp } from "../context/AppContext";
import { Truck, MapPin, CheckCircle2, Clock, Phone, Navigation, ArrowRight, ShieldCheck } from "lucide-react";

export const DispatchTracker = () => {
    const { feedItems, refreshData, addToast } = useApp();

    return (
        <div className="data-panel-card" id="dispatch-tracker-view">
            <div className="panel-header" style={{ marginBottom: "24px" }}>
                <div className="panel-title-group">
                    <h2>
                        <Truck size={20} style={{ color: "#0284c7" }} />
                        <span>Real-Time Dispatch & Logistics Tracker</span>
                    </h2>
                    <p className="panel-subtitle">
                        Tracking dynamic routing and cold-chain/ambient transit between donors and beneficiary shelters
                    </p>
                </div>
            </div>

            {/* Active Dispatches */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {feedItems && feedItems.length > 0 ? (
                    feedItems.map((item, idx) => (
                        <div
                            key={item.id || idx}
                            style={{
                                border: "1px solid #e2e8f0",
                                borderRadius: "14px",
                                padding: "24px",
                                background: "#ffffff",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
                            }}
                        >
                            {/* Route Top Info */}
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", marginBottom: "18px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                    <span className="match-code-badge" style={{ fontSize: "12px", padding: "4px 8px" }}>
                                        {item.id || "MCH-8801"}
                                    </span>
                                    <span style={{ fontWeight: "800", fontSize: "16px", color: "#0f172a" }}>
                                        {item.donorName} <ArrowRight size={14} style={{ display: "inline" }} /> {item.receiverName}
                                    </span>
                                </div>

                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span className="status-tag en-route">
                                        <Navigation size={12} />
                                        <span>Status: {item.status || "En Route"}</span>
                                    </span>
                                    <span style={{ fontSize: "12px", color: "#64748b" }}>
                                        ETA: ~25 mins
                                    </span>
                                </div>
                            </div>

                            {/* Timeline Stepper */}
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(4, 1fr)",
                                    gap: "12px",
                                    margin: "24px 0",
                                    position: "relative"
                                }}
                            >
                                {/* Step 1 */}
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                                    <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#059669", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "8px" }}>
                                        <CheckCircle2 size={16} />
                                    </div>
                                    <span style={{ fontSize: "12px", fontWeight: "700", color: "#0f172a" }}>Algorithm Matched</span>
                                    <span style={{ fontSize: "11px", color: "#64748b" }}>Compatibility: 98%</span>
                                </div>

                                {/* Step 2 */}
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                                    <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#059669", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "8px" }}>
                                        <CheckCircle2 size={16} />
                                    </div>
                                    <span style={{ fontSize: "12px", fontWeight: "700", color: "#0f172a" }}>Donation Reserved</span>
                                    <span style={{ fontSize: "11px", color: "#64748b" }}>Service 1 Locked</span>
                                </div>

                                {/* Step 3 */}
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                                    <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#0284c7", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "8px", boxShadow: "0 0 10px rgba(2, 132, 199, 0.5)" }}>
                                        <Truck size={16} />
                                    </div>
                                    <span style={{ fontSize: "12px", fontWeight: "700", color: "#0284c7" }}>In Transit / Dispatch</span>
                                    <span style={{ fontSize: "11px", color: "#64748b" }}>Van #4 on route</span>
                                </div>

                                {/* Step 4 */}
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                                    <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#e2e8f0", color: "#94a3b8", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "8px" }}>
                                        <Clock size={16} />
                                    </div>
                                    <span style={{ fontSize: "12px", fontWeight: "700", color: "#64748b" }}>Shelter Delivery</span>
                                    <span style={{ fontSize: "11px", color: "#94a3b8" }}>Awaiting Arrival</span>
                                </div>
                            </div>

                            {/* Logistics Details */}
                            <div style={{ background: "#f8fafc", borderRadius: "10px", padding: "14px 18px", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", fontSize: "13px" }}>
                                <div>
                                    <div style={{ color: "#64748b", fontSize: "11px", textTransform: "uppercase", fontWeight: "700" }}>Cargo Manifest</div>
                                    <div style={{ fontWeight: "600", color: "#0f172a" }}>{item.itemDescription}</div>
                                </div>

                                <div>
                                    <div style={{ color: "#64748b", fontSize: "11px", textTransform: "uppercase", fontWeight: "700" }}>Assigned Driver</div>
                                    <div style={{ fontWeight: "600", color: "#0f172a" }}>Marcus Rivera (FoodRescue Volunteer Fleet)</div>
                                </div>

                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <button
                                        className="btn-table-action"
                                        onClick={() => addToast("Contacting logistics dispatch coordinator...", "info")}
                                        style={{ display: "flex", alignItems: "center", gap: "6px" }}
                                    >
                                        <Phone size={13} />
                                        <span>Call Dispatch</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                        <Truck size={32} style={{ margin: "0 auto 10px auto", opacity: 0.5 }} />
                        <p>No active dispatches right now. When requests are matched, their live journey displays here!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DispatchTracker;
