import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext";
import { User, X, LogOut, CheckCircle } from "lucide-react";

export const ProfileModal = () => {
    const { user, updateProfile, logout } = useAuth();
    const { isProfileModalOpen, setIsProfileModalOpen, addToast } = useApp();

    const [formData, setFormData] = useState({
        name: user?.name || "",
        organizationName: user?.organizationName || "",
        phone: user?.phone || "",
        location: user?.location || "",
        accountType: user?.accountType || ""
    });

    const [isSaving, setIsSaving] = useState(false);

    if (!isProfileModalOpen || !user) return null;

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSave = async (e) => {
        e.preventDefault();

        const digits = (formData.phone || "").replace(/\D/g, "");
        if (!formData.phone.trim() || digits.length < 7 || digits.length > 15) {
            addToast("Please provide a valid phone number (7 to 15 digits).", "error");
            return;
        }

        setIsSaving(true);
        try {
            await updateProfile(formData);
            addToast("Profile updated successfully!", "success");
            setIsProfileModalOpen(false);
        } catch (err) {
            addToast(err.response?.data?.message || "Failed to update profile", "error");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="modal-backdrop" onClick={() => setIsProfileModalOpen(false)} role="dialog" aria-modal="true">
            <div className="modal-card" style={{ maxWidth: "500px" }} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="modal-header">
                    <div className="modal-title-wrap">
                        <div className="modal-header-icon green">
                            <User size={24} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="modal-title">Account Profile</h2>
                            <span style={{ fontSize: "12px", color: "#64748b" }}>
                                Registered Role: <strong style={{ textTransform: "capitalize", color: "#00b87c" }}>{user.role}</strong>
                            </span>
                        </div>
                    </div>
                    <button
                        className="modal-close-btn"
                        onClick={() => setIsProfileModalOpen(false)}
                        aria-label="Close modal"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSave} id="profile-edit-form">
                    <div className="form-group">
                        <label className="form-label" htmlFor="prof-name">Full Name</label>
                        <input
                            id="prof-name"
                            name="name"
                            type="text"
                            required
                            className="form-input"
                            value={formData.name}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="prof-org">Organization Name</label>
                        <input
                            id="prof-org"
                            name="organizationName"
                            type="text"
                            className="form-input"
                            value={formData.organizationName}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Email Address (Read-only)</label>
                        <input
                            type="text"
                            disabled
                            className="form-input"
                            value={user.email}
                            style={{ background: "#f8fafc", color: "#64748b" }}
                        />
                    </div>

                    <div className="form-grid-2">
                        <div className="form-group">
                            <label className="form-label" htmlFor="prof-phone">
                                Phone Number <span style={{ color: "#ef4444" }}>*</span>
                            </label>
                            <input
                                id="prof-phone"
                                name="phone"
                                type="tel"
                                required
                                className="form-input"
                                placeholder="+1 (555) 019-9922"
                                value={formData.phone}
                                onChange={handleChange}
                            />
                            <span style={{ fontSize: "11px", color: "#64748b", marginTop: "3px", display: "block" }}>
                                Used for direct calling during food coordination.
                            </span>
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="prof-loc">Location</label>
                            <input
                                id="prof-loc"
                                name="location"
                                type="text"
                                className="form-input"
                                value={formData.location}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="modal-footer" style={{ justifyContent: "space-between" }}>
                        <button
                            type="button"
                            className="btn-cancel"
                            style={{ color: "#ef4444", display: "flex", alignItems: "center", gap: "6px" }}
                            onClick={() => {
                                logout();
                                setIsProfileModalOpen(false);
                            }}
                        >
                            <LogOut size={14} />
                            <span>Sign Out</span>
                        </button>

                        <div style={{ display: "flex", gap: "10px" }}>
                            <button
                                type="button"
                                className="btn-cancel"
                                onClick={() => setIsProfileModalOpen(false)}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn-publish-green"
                                disabled={isSaving}
                            >
                                {isSaving ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfileModal;
