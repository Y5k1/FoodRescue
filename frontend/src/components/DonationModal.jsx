import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import donationService from "../services/donationService";
import { HeartHandshake, X } from "lucide-react";

export const DonationModal = () => {
    const { isDonationModalOpen, setIsDonationModalOpen, refreshData, addToast } = useApp();
    const { user } = useAuth();

    const [formData, setFormData] = useState({
        donorName: user?.organizationName || user?.name || "Campus Canteen Building A",
        donorType: "College Canteen",
        dietaryTag: "Vegetarian",
        foodName: "Rice, Steamed Veggies & Dinner Rolls",
        category: "Cooked Food",
        quantity: 30,
        unit: "Meals",
        shelfLifeHours: 4,
        location: user?.location || "Loading Dock 2, Main Campus",
        contactPhone: user?.phone || "+1 (555) 019-9922",
        description: ""
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isDonationModalOpen && user) {
            setFormData(prev => ({
                ...prev,
                donorName: user.organizationName || user.name || prev.donorName,
                location: user.location || prev.location,
                contactPhone: user.phone || prev.contactPhone
            }));
        }
    }, [isDonationModalOpen, user]);

    if (!isDonationModalOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const digits = (formData.contactPhone || "").replace(/\D/g, "");
        if (!formData.contactPhone.trim() || digits.length < 7 || digits.length > 15) {
            addToast("Please provide a valid contact phone number (7 to 15 digits).", "error");
            return;
        }

        setIsSubmitting(true);

        try {
            const payload = {
                donorName: formData.donorName.trim(),
                donorType: formData.donorType,
                dietaryTag: formData.dietaryTag,
                foodName: formData.foodName.trim(),
                category: formData.category || "Cooked Food",
                quantity: Number(formData.quantity) || 1,
                unit: formData.unit || "Meals",
                shelfLifeHours: Number(formData.shelfLifeHours) || 4,
                expiryTime: new Date(Date.now() + (Number(formData.shelfLifeHours) || 4) * 3600 * 1000).toISOString(),
                location: formData.location.trim(),
                contactPhone: formData.contactPhone.trim(),
                description: formData.description || ""
            };

            const response = await donationService.createDonation(payload);
            addToast("Donation published successfully to Service 1 (port 5001)!", "success");
            setIsDonationModalOpen(false);
            await refreshData();
        } catch (err) {
            console.error("Donation creation failed:", err);
            addToast(
                err.response?.data?.message || "Failed to create donation. Verify Service 1 is active on port 5001.",
                "error"
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-backdrop" onClick={() => setIsDonationModalOpen(false)} role="dialog" aria-modal="true">
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                {/* Modal Header */}
                <div className="modal-header">
                    <div className="modal-title-wrap">
                        <div className="modal-header-icon green">
                            <HeartHandshake size={24} strokeWidth={2.5} />
                        </div>
                        <h2 className="modal-title">Post Surplus Food Donation</h2>
                    </div>
                    <button
                        className="modal-close-btn"
                        onClick={() => setIsDonationModalOpen(false)}
                        aria-label="Close modal"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} id="post-donation-form">
                    {/* Donor Name */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="donorName">
                            Donor Name / Organization
                        </label>
                        <input
                            id="donorName"
                            name="donorName"
                            type="text"
                            required
                            className="form-input"
                            value={formData.donorName}
                            onChange={handleChange}
                            placeholder="e.g., Campus Canteen Building A"
                        />
                    </div>

                    {/* Donor Type & Dietary Tag */}
                    <div className="form-grid-2">
                        <div className="form-group">
                            <label className="form-label" htmlFor="donorType">
                                Donor Type
                            </label>
                            <select
                                id="donorType"
                                name="donorType"
                                className="form-select"
                                value={formData.donorType}
                                onChange={handleChange}
                            >
                                <option value="College Canteen">College Canteen</option>
                                <option value="Restaurant">Restaurant</option>
                                <option value="Bakery">Bakery</option>
                                <option value="Supermarket">Supermarket</option>
                                <option value="Hotel">Hotel</option>
                                <option value="Catering">Catering</option>
                                <option value="Individual Donor">Individual Donor</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="dietaryTag">
                                Dietary Tag
                            </label>
                            <select
                                id="dietaryTag"
                                name="dietaryTag"
                                className="form-select"
                                value={formData.dietaryTag}
                                onChange={handleChange}
                            >
                                <option value="Vegetarian">Vegetarian</option>
                                <option value="Vegan">Vegan</option>
                                <option value="Non-Vegetarian">Non-Vegetarian</option>
                                <option value="Halal">Halal</option>
                                <option value="Bakery">Bakery</option>
                                <option value="Packaged Food">Packaged Food</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>

                    {/* Food Details & Menu */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="foodName">
                            Food Details & Menu
                        </label>
                        <input
                            id="foodName"
                            name="foodName"
                            type="text"
                            required
                            className="form-input"
                            value={formData.foodName}
                            onChange={handleChange}
                            placeholder="e.g., Rice, Steamed Veggies & Dinner Rolls"
                        />
                    </div>

                    {/* Quantity & Shelf Life */}
                    <div className="form-grid-2">
                        <div className="form-group">
                            <label className="form-label" htmlFor="quantity">
                                Quantity (Servings)
                            </label>
                            <input
                                id="quantity"
                                name="quantity"
                                type="number"
                                min="1"
                                required
                                className="form-input"
                                value={formData.quantity}
                                onChange={handleChange}
                                placeholder="30"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="shelfLifeHours">
                                Shelf Life (Hours)
                            </label>
                            <input
                                id="shelfLifeHours"
                                name="shelfLifeHours"
                                type="number"
                                min="1"
                                required
                                className="form-input"
                                value={formData.shelfLifeHours}
                                onChange={handleChange}
                                placeholder="4"
                            />
                        </div>
                    </div>

                    {/* Pickup Address / Location */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="location">
                            Pickup Address / Location
                        </label>
                        <input
                            id="location"
                            name="location"
                            type="text"
                            required
                            className="form-input"
                            value={formData.location}
                            onChange={handleChange}
                            placeholder="e.g., Loading Dock 2, Main Campus"
                        />
                    </div>

                    {/* Contact Phone */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="contactPhone">
                            Contact Phone <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <input
                            id="contactPhone"
                            name="contactPhone"
                            type="tel"
                            required
                            className="form-input"
                            value={formData.contactPhone}
                            onChange={handleChange}
                            placeholder="+1 (555) 019-9922"
                        />
                        <span style={{ fontSize: "11px", color: "#64748b", marginTop: "3px", display: "block" }}>
                            Requesters can call this number directly to coordinate food collection.
                        </span>
                    </div>

                    {/* Modal Footer */}
                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn-cancel"
                            onClick={() => setIsDonationModalOpen(false)}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            id="btn-publish-donation"
                            className="btn-publish-green"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Publishing..." : "Publish to Microservice REST"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DonationModal;
