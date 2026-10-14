import React, { useState } from "react";
import { Phone, Copy, Check } from "lucide-react";

/**
 * NativeDialerButton (Approach A: Direct Native Dialing)
 * 
 * Directly opens the native operating system dialer:
 * - On Mobile (Android / iPhone): Opens the native Phone app dialer with prefilled number.
 * - On Desktop (Windows / Mac): Opens the default calling app (Phone Link, FaceTime, Skype).
 * Also includes an optional 1-click "Copy Number" helper for desktop users.
 */
export const NativeDialerButton = ({
    phoneNumber,
    label = "Call",
    showNumber = false,
    showCopy = true,
    size = "sm",
    variant = "primary",
    id,
    style = {},
    title
}) => {
    const [copied, setCopied] = useState(false);

    if (!phoneNumber || !phoneNumber.trim()) {
        return null;
    }

    // Clean phone number for tel: URI (preserve leading +, remove spaces, hyphens, parentheses)
    const cleaned = phoneNumber.replace(/[^\d+]/g, "");
    const telUri = `tel:${cleaned}`;

    const handleClick = (e) => {
        // Prevent triggering parent container click (e.g. accordion/card/row)
        e.stopPropagation();
    };

    const handleCopy = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (navigator?.clipboard?.writeText) {
            navigator.clipboard.writeText(phoneNumber.trim());
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    // Styling variants
    const isSmall = size === "sm";
    const isPrimary = variant === "primary";
    const isSuccess = variant === "success";

    const baseStyles = {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: isSmall ? "5px" : "7px",
        padding: isSmall ? "4px 10px" : "8px 16px",
        fontSize: isSmall ? "12px" : "13px",
        fontWeight: "600",
        borderRadius: "7px",
        textDecoration: "none",
        cursor: "pointer",
        transition: "all 0.15s ease",
        whiteSpace: "nowrap",
        border: "1px solid",
        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
        ...style
    };

    let themeStyles = {};
    if (isPrimary) {
        themeStyles = {
            background: "#eff6ff",
            color: "#1d4ed8",
            borderColor: "#bfdbfe"
        };
    } else if (isSuccess) {
        themeStyles = {
            background: "#ecfdf5",
            color: "#047857",
            borderColor: "#a7f3d0"
        };
    } else {
        themeStyles = {
            background: "#f8fafc",
            color: "#334155",
            borderColor: "#cbd5e1"
        };
    }

    const copyBtnStyle = {
        background: "transparent",
        border: "none",
        cursor: "pointer",
        padding: "3px 6px",
        borderRadius: "4px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color: copied ? "#059669" : "#64748b",
        transition: "all 0.15s ease",
        marginLeft: "2px"
    };

    return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <a
                href={telUri}
                id={id}
                onClick={handleClick}
                style={{ ...baseStyles, ...themeStyles }}
                className="native-dialer-btn"
                title={title || `Call ${phoneNumber} directly via device dialer`}
                target="_self"
                rel="noopener noreferrer"
            >
                <Phone size={isSmall ? 13 : 15} style={{ flexShrink: 0 }} />
                <span>
                    {label}
                    {showNumber && ` (${phoneNumber})`}
                </span>
            </a>

            {showCopy && (
                <button
                    type="button"
                    onClick={handleCopy}
                    style={copyBtnStyle}
                    title={copied ? "Copied to clipboard!" : `Copy number ${phoneNumber}`}
                    aria-label="Copy phone number"
                >
                    {copied ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", fontSize: "11px", fontWeight: "600" }}>
                            <Check size={12} strokeWidth={3} />
                            <span>Copied</span>
                        </span>
                    ) : (
                        <Copy size={13} />
                    )}
                </button>
            )}
        </span>
    );
};

export default NativeDialerButton;
