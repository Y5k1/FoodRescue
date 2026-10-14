import React from "react";
import { useApp } from "../context/AppContext";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export const Toast = () => {
    const { toasts, removeToast } = useApp();

    if (!toasts || toasts.length === 0) return null;

    return (
        <div className="toast-container" aria-live="polite">
            {toasts.map((toast) => (
                <div key={toast.id} className={`toast-item ${toast.type}`}>
                    {toast.type === "success" && <CheckCircle2 size={16} style={{ color: "#00b87c", flexShrink: 0 }} />}
                    {toast.type === "error" && <AlertCircle size={16} style={{ color: "#ef4444", flexShrink: 0 }} />}
                    {toast.type === "info" && <Info size={16} style={{ color: "#3b82f6", flexShrink: 0 }} />}

                    <span style={{ flex: 1 }}>{toast.message}</span>

                    <button
                        onClick={() => removeToast(toast.id)}
                        style={{ color: "#94a3b8", display: "flex", alignItems: "center" }}
                        aria-label="Dismiss notification"
                    >
                        <X size={14} />
                    </button>
                </div>
            ))}
        </div>
    );
};

export default Toast;
