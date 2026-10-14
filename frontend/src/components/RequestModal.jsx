import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import requestService from "../services/requestService";
import { Utensils, X, CheckCircle2, AlertCircle, Building, Clock, MapPin } from "lucide-react";

export const RequestModal = () => {
    const {
        isRequestModalOpen,
        setIsRequestModalOpen,
        selectedDonationForRequest,
        setSelectedDonationForRequest,
        refreshData,
        addToast,
        setActiveTab
    } = useApp();

    const { user } = useAuth();

    const [formData, setFormData] = useState({
        quantity: 1,
        organizationName: user?.organizationName || "",
        location: user?.location || "",
        peopleCount: 1,
        neededBy: "",
        description: "",
        contactPhone: user?.phone || ""
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submittedSuccess, setSubmittedSuccess] = useState(false);
    const [validationError, setValidationError] = useState("");

    const donation = selectedDonationForRequest;
    const maxAvailable = donation ? (donation.availableQuantity !== undefined ? donation.availableQuantity : donation.quantity) : 100;

    useEffect(() => {
        if (donation) {
            setFormData(prev => ({
                ...prev,
                organizationName: user?.organizationName || prev.organizationName,
                location: user?.location || prev.location,
                contactPhone: user?.phone || prev.contactPhone,
                quantity: maxAvailable > 0 ? maxAvailable : 1,
                neededBy: new Date(Date.now() + 12 * 3600 * 1000).toISOString().slice(0, 16)
            }));
            setSubmittedSuccess(false);
            setValidationError("");
        }
    }, [donation, maxAvailable, user]);

    if (!isRequestModalOpen || !donation) return null;

    const handleChange = (e) => {
        setValidationError("");
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setValidationError("");

        const reqQty = Number(formData.quantity);
        if (!reqQty || reqQty <= 0) {
            setValidationError("Please enter a valid positive quantity.");
            return;
        }

        if (reqQty > maxAvailable) {
            setValidationError(`Requested quantity exceeds available surplus (${maxAvailable} ${donation.unit}).`);
            return;
        }

        const digits = (formData.contactPhone || "").replace(/\D/g, "");
        if (!formData.contactPhone.trim() || digits.length < 7 || digits.length > 15) {
            setValidationError("Please enter a valid contact phone number (7 to 15 digits). Required so the supplier can call you.");
            return;
        }

        setIsSubmitting(true);

        try {
            const payload = {
                donationId: donation._id,
                quantity: reqQty,
                unit: donation.unit,
                organizationName: formData.organizationName.trim(),
                location: formData.location.trim(),
                peopleCount: Number(formData.peopleCount) || 1,
                neededBy: formData.neededBy ? new Date(formData.neededBy).toISOString() : new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
                description: formData.description.trim(),
                contactPhone: formData.contactPhone.trim()
            };

            await requestService.createRequest(payload);
            setSubmittedSuccess(true);
            addToast("Food Request submitted! Notification dispatched to the supplier.", "success");
            await refreshData();
        } catch (err) {
            console.error("Request submission failed:", err);
            setValidationError(
                err.response?.data?.message || "Failed to submit request. Please verify the donation is still available."
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setIsRequestModalOpen(false);
        setSelectedDonationForRequest(null);
        setSubmittedSuccess(false);
    };

    const handleViewMyRequests = () => {
        handleClose();
        setActiveTab("my-requests");
    };

    return (
        <div className="modal-backdrop" onClick={handleClose} role="dialog" aria-modal="true">
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="modal-header">
                    <div className="modal-title-wrap">
                        <div className="modal-header-icon orange">
                            <Utensils size={24} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="modal-title">Request This Food</h2>
                            <p style={{ fontSize: "12px", color: "#64748b" }}>
                                Linked directly to surplus donation #{donation._id.slice(-6)}
                            </p>
                        </div>
                    </div>
                    <button
                        className="modal-close-btn"
                        onClick={handleClose}
                        aria-label="Close modal"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Donation Summary Preview */}
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "14px", marginBottom: "18px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                        <div>
                            <span style={{ fontSize: "15px", fontWeight: "800", color: "#0f172a" }}>
                                {donation.foodName}
                            </span>
                            <div style={{ fontSize: "12px", color: "#047857", fontWeight: "600" }}>
                                {donation.category} • {donation.dietaryTag}
                            </div>
                        </div>

                        <span className="status-tag ready">
                            {maxAvailable} {donation.unit} Available
                        </span>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", fontSize: "12px", color: "#64748b" }}>
                        <div><strong>Supplier:</strong> {donation.donorName}</div>
                        <div><strong>Pickup:</strong> {donation.location}</div>
                        <div><strong>Expires:</strong> {new Date(donation.expiryTime).toLocaleDateString()} {new Date(donation.expiryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                </div>

                {/* Confirmation screen on successful submission */}
                {submittedSuccess ? (
                    <div style={{ textAlign: "center", padding: "20px 0" }}>
                        <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#dcfce7", color: "#15803d", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px auto" }}>
                            <CheckCircle2 size={28} />
                        </div>
                        <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>
                            Request Submitted Successfully!
                        </h3>
                        <p style={{ fontSize: "13px", color: "#475569", marginTop: "6px" }}>
                            Your request is now in <strong>Pending</strong> status. A notification has been sent to <strong>{donation.donorName}</strong>. You will receive an alert once reviewed.
                        </p>

                        <div className="modal-footer" style={{ justifyContent: "center", marginTop: "24px" }}>
                            <button
                                type="button"
                                className="btn-cancel"
                                onClick={handleClose}
                            >
                                Done
                            </button>
                            <button
                                type="button"
                                className="btn-publish-orange"
                                onClick={handleViewMyRequests}
                            >
                                View My Requests
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Request Form */
                    <form onSubmit={handleSubmit} id="submit-targeted-request-form">
                        {validationError && (
                            <div style={{ background: "#fee2e2", border: "1px solid #fecaca", color: "#b91c1c", padding: "10px 14px", borderRadius: "8px", fontSize: "13px", marginBottom: "14px" }}>
                                {validationError}
                            </div>
                        )}

                        {/* Quantity & Unit */}
                        <div className="form-grid-2">
                            <div className="form-group">
                                <label className="form-label" htmlFor="req-qty">
                                    Quantity Requested (Max: {maxAvailable})
                                </label>
                                <input
                                    id="req-qty"
                                    name="quantity"
                                    type="number"
                                    min="1"
                                    max={maxAvailable}
                                    required
                                    className="form-input"
                                    value={formData.quantity}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    Unit (From Donation)
                                </label>
                                <input
                                    type="text"
                                    disabled
                                    className="form-input"
                                    value={donation.unit}
                                    style={{ background: "#f8fafc", color: "#64748b" }}
                                />
                            </div>
                        </div>

                        {/* Organization & Location */}
                        <div className="form-grid-2">
                            <div className="form-group">
                                <label className="form-label" htmlFor="req-org">
                                    Organization / Shelter Name
                                </label>
                                <input
                                    id="req-org"
                                    name="organizationName"
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g., St. Vincent Food Bank"
                                    value={formData.organizationName}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="req-loc">
                                    Requester Location / Address
                                </label>
                                <input
                                    id="req-loc"
                                    name="location"
                                    type="text"
                                    required
                                    className="form-input"
                                    placeholder="e.g., 500 Mission Street"
                                    value={formData.location}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Beneficiaries & Required By */}
                        <div className="form-grid-2">
                            <div className="form-group">
                                <label className="form-label" htmlFor="req-people">
                                    Number of People to be Served
                                </label>
                                <input
                                    id="req-people"
                                    name="peopleCount"
                                    type="number"
                                    min="1"
                                    required
                                    className="form-input"
                                    value={formData.peopleCount}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="req-neededBy">
                                    Required By (Date & Time)
                                </label>
                                <input
                                    id="req-neededBy"
                                    name="neededBy"
                                    type="datetime-local"
                                    required
                                    className="form-input"
                                    value={formData.neededBy}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Contact Phone */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="req-phone">
                                Contact Phone <span style={{ color: "#ef4444" }}>*</span>
                            </label>
                            <input
                                id="req-phone"
                                name="contactPhone"
                                type="tel"
                                required
                                className="form-input"
                                placeholder="+1 (555) 012-3344"
                                value={formData.contactPhone}
                                onChange={handleChange}
                            />
                            <span style={{ fontSize: "11px", color: "#64748b", marginTop: "3px", display: "block" }}>
                                The food supplier will call this number directly to confirm handover or delivery.
                            </span>
                        </div>

                        {/* Additional Message / Description */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="req-desc">
                                Additional Message / Description
                            </label>
                            <textarea
                                id="req-desc"
                                name="description"
                                rows="2"
                                className="form-textarea"
                                placeholder="State any specific pickup needs or serving context..."
                                value={formData.description}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Footer */}
                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn-cancel"
                                onClick={handleClose}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                id="btn-submit-food-request"
                                className="btn-publish-orange"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Submitting Request..." : "Submit Food Request"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default RequestModal;
