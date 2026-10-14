import React from "react";
import { useApp } from "../context/AppContext";
import { Database, Terminal, Radio } from "lucide-react";

export const ApiEventStream = () => {
    const { eventLogs } = useApp();

    const getServiceClass = (serviceName) => {
        const s = (serviceName || "").toLowerCase();
        if (s.includes("donation")) return "donation";
        if (s.includes("match")) return "matching";
        return "request";
    };

    return (
        <div className="terminal-panel" id="api-event-stream-panel">
            {/* Header */}
            <div className="terminal-header">
                <div className="terminal-title-group">
                    <Database size={16} style={{ color: "#34d399" }} />
                    <h2>REST API Event Stream</h2>
                </div>

                <div className="terminal-live-badge">
                    <Radio size={10} className="animate-pulse" />
                    <span>Live Logs</span>
                </div>
            </div>

            {/* Event Logs List */}
            <div className="terminal-logs-list" role="log" aria-label="API Event Stream Logs">
                {eventLogs && eventLogs.length > 0 ? (
                    eventLogs.slice(0, 7).map((log, index) => (
                        <div key={log.id || index} className={`terminal-log-entry ${getServiceClass(log.service)}`}>
                            <div className="log-meta-line">
                                <span className="log-service-tag">[{log.service}]</span>
                                <span>{log.time || "Just now"}</span>
                            </div>
                            <div className="log-message">{log.message}</div>
                        </div>
                    ))
                ) : (
                    <div style={{ color: "#64748b", textAlign: "center", padding: "20px 0" }}>
                        Waiting for REST requests...
                    </div>
                )}
            </div>

            {/* Footer Note */}
            <div className="terminal-footer-note">
                Services synchronized via HTTP / REST endpoints on ports 5001 & 5002
            </div>
        </div>
    );
};

export default ApiEventStream;
