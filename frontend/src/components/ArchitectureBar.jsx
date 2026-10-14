import React from "react";
import { useApp } from "../context/AppContext";
import { Server, RefreshCw, Zap } from "lucide-react";

export const ArchitectureBar = () => {
    const { svc1Status, svc2Status, triggerAutoMatch, isAutoMatching } = useApp();

    return (
        <div className="architecture-status-row" id="system-architecture-bar">
            <div className="architecture-status-content">
                {/* Section title */}
                <div className="architecture-label-group">
                    <Server size={14} />
                    <span>System Architecture Status:</span>
                </div>

                {/* Microservices Health Badges */}
                <div className="status-badges-group">
                    {/* Service 1: Food Donation Service */}
                    <div className="service-status-pill" id="svc1-indicator" title="Service 1 Status">
                        <span className={`status-dot ${svc1Status.healthy ? "" : "red"}`} />
                        <span>Svc 1: Donation (:5001 • MongoDB)</span>
                        <span className={`status-latency-badge ${svc1Status.healthy ? "" : "warn"}`}>
                            {svc1Status.healthy ? `${svc1Status.latencyMs}ms` : "Down"}
                        </span>
                    </div>

                    {/* Service 2: Request & Matching Service */}
                    <div className="service-status-pill" id="svc2-indicator" title="Service 2 Status">
                        <span className={`status-dot ${svc2Status.healthy ? "" : "red"}`} />
                        <span>Svc 2: Matching/Req (:5002 • Express REST)</span>
                        <span className={`status-latency-badge ${svc2Status.healthy ? "" : "warn"}`}>
                            {svc2Status.healthy ? `${svc2Status.latencyMs}ms` : "Down"}
                        </span>
                    </div>

                    {/* Engine Status */}
                    <div className="service-status-pill" id="engine-indicator">
                        <Zap size={13} style={{ color: "#fbbf24" }} />
                        <span>Algorithmic Match Engine</span>
                        <span className="status-latency-badge" style={{ background: "rgba(251, 191, 36, 0.15)", color: "#fbbf24" }}>
                            Active
                        </span>
                    </div>

                    {/* Trigger Auto Match Button */}
                    <button
                        id="btn-trigger-auto-match"
                        className="btn-trigger-match"
                        onClick={triggerAutoMatch}
                        disabled={isAutoMatching}
                        title="Run Algorithmic Proximity Match across all open records"
                    >
                        <RefreshCw size={12} className={isAutoMatching ? "animate-spin" : ""} />
                        <span>{isAutoMatching ? "Matching..." : "Trigger Auto Match"}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ArchitectureBar;
