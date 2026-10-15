import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext";
import { HeartHandshake, Utensils, Building2, Eye, EyeOff, ShieldCheck, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";

export const AuthLanding = ({ onExploreDemo }) => {
    const { login, register } = useAuth();
    const { addToast, setViewMode } = useApp();

    const [mode, setMode] = useState("login"); // 'login' | 'register'
    const [selectedRole, setSelectedRole] = useState("supplier"); // 'supplier' | 'requester'

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const [formData, setFormData] = useState({
        name: "",
        organizationName: "",
        email: "",
        phone: "",
        location: "",
        accountType: "",
        password: "",
        confirmPassword: ""
    });

    const handleChange = (e) => {
        setErrorMessage("");
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleRoleSelect = (role) => {
        setSelectedRole(role);
        setErrorMessage("");
        if (role === "supplier") {
            setFormData(prev => ({ ...prev, accountType: prev.accountType || "Restaurant" }));
        } else {
            setFormData(prev => ({ ...prev, accountType: prev.accountType || "NGO Food Bank" }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage("");
        setIsSubmitting(true);

        try {
            if (mode === "register") {
                if (formData.password !== formData.confirmPassword) {
                    setErrorMessage("Passwords do not match.");
                    setIsSubmitting(false);
                    return;
                }
                if (formData.password.length < 6) {
                    setErrorMessage("Password must be at least 6 characters long.");
                    setIsSubmitting(false);
                    return;
                }

                const digits = (formData.phone || "").replace(/\D/g, "");
                if (!formData.phone.trim() || digits.length < 7 || digits.length > 15) {
                    setErrorMessage("Please enter a valid phone number (7 to 15 digits). Required for user coordination.");
                    setIsSubmitting(false);
                    return;
                }

                await register({
                    name: formData.name,
                    organizationName: formData.organizationName,
                    email: formData.email,
                    phone: formData.phone,
                    location: formData.location,
                    accountType: formData.accountType,
                    password: formData.password,
                    confirmPassword: formData.confirmPassword,
                    role: selectedRole
                });

                addToast(`Welcome to FoodRescue! Registered as ${selectedRole === "supplier" ? "Food Supplier" : "Food Requester"}.`, "success");
                setViewMode(selectedRole === "supplier" ? "donor" : "receiver");
            } else {
                // Login
                const res = await login({
                    email: formData.email,
                    password: formData.password,
                    role: selectedRole
                });

                const effectiveRole = res?.user?.role || selectedRole;
                addToast(res?.message || `Signed in successfully as ${effectiveRole === "supplier" ? "Food Supplier" : "Food Requester"}!`, "success");
                setViewMode(effectiveRole === "supplier" ? "donor" : "receiver");
            }
        } catch (err) {
            console.error("Auth error:", err);
            setErrorMessage(err.response?.data?.message || "Authentication failed. Please check your credentials.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleQuickFill = (role) => {
        handleRoleSelect(role);
        if (role === "supplier") {
            setFormData({
                name: "Chef Raymond",
                organizationName: "Grand Hyatt Catering",
                email: "hyatt@test.com",
                phone: "+1 (555) 019-9922",
                location: "Downtown Hotel District",
                accountType: "Catering",
                password: "password123",
                confirmPassword: "password123"
            });
        } else {
            setFormData({
                name: "Sister Mary",
                organizationName: "St. Jude Homeless Shelter",
                email: "shelter@test.com",
                phone: "+1 (555) 012-3344",
                location: "500 Mission Street",
                accountType: "Shelter",
                password: "password123",
                confirmPassword: "password123"
            });
        }
    };

    return (
        <div className="auth-landing-screen" id="auth-landing-screen">
            <div className="auth-landing-box">
                {/* Left Side: Brand & Mission Visuals */}
                <div className="auth-hero-sidebar">
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div className="brand-logo-icon">
                                <HeartHandshake size={22} strokeWidth={2.2} />
                            </div>
                            <span style={{ fontSize: "20px", fontWeight: "800", color: "#ffffff" }}>FoodRescue</span>
                        </div>

                        <h1>Sustainable Surplus Food Redistribution in Real-Time</h1>

                        <p style={{ marginTop: "14px", fontSize: "14px", color: "#a7f3d0", lineHeight: "1.6" }}>
                            FoodRescue bridges the gap between commercial surplus kitchens, restaurants, and caterers
                            with local community shelters through an automated REST microservice matching engine.
                        </p>

                        <div style={{ marginTop: "24px", display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <CheckCircle2 size={16} style={{ color: "#34d399" }} />
                                <span>Service 1: Surplus Inventory & Expiry Management (:5001)</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <CheckCircle2 size={16} style={{ color: "#34d399" }} />
                                <span>Service 2: Proximity & Dietary Algorithmic Match Engine (:5002)</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <CheckCircle2 size={16} style={{ color: "#34d399" }} />
                                <span>Atomic Reservation with Guaranteed Rollback Protection</span>
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: "30px", borderTop: "1px solid rgba(255,255,255,0.15)", paddingTop: "16px" }}>
                        <button
                            id="btn-explore-demo"
                            className="btn-panel-action"
                            style={{ background: "rgba(255,255,255,0.1)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.2)", width: "100%", justifyContent: "center", padding: "10px" }}
                            onClick={onExploreDemo}
                        >
                            <Sparkles size={14} style={{ color: "#34d399" }} />
                            <span>Explore Live Architecture (Guest Demo Mode)</span>
                        </button>
                    </div>
                </div>

                {/* Right Side: Role Selection & Form */}
                <div className="auth-form-content">
                    <div style={{ marginBottom: "20px" }}>
                        <span style={{ fontSize: "11px", fontWeight: "800", color: "#00b87c", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Step 1: Choose Your Role
                        </span>
                        <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", marginTop: "4px" }}>
                            Join FoodRescue Network
                        </h2>
                    </div>

                    {/* Role Choice Cards */}
                    <div className="role-choice-container">
                        {/* Food Supplier */}
                        <div
                            id="role-supplier-card"
                            className={`role-choice-card ${selectedRole === "supplier" ? "selected supplier" : ""}`}
                            onClick={() => handleRoleSelect("supplier")}
                        >
                            <Building2 size={24} style={{ color: selectedRole === "supplier" ? "#00b87c" : "#64748b" }} />
                            <div className="role-card-title">Food Supplier</div>
                            <div className="role-card-desc">Restaurant, Catering, Canteen, Bakery, Hotel</div>
                        </div>

                        {/* Food Requester */}
                        <div
                            id="role-requester-card"
                            className={`role-choice-card ${selectedRole === "requester" ? "selected requester" : ""}`}
                            onClick={() => handleRoleSelect("requester")}
                        >
                            <Utensils size={24} style={{ color: selectedRole === "requester" ? "#ea580c" : "#64748b" }} />
                            <div className="role-card-title">Food Requester</div>
                            <div className="role-card-desc">NGO, Shelter, Food Bank, Community Kitchen</div>
                        </div>
                    </div>

                    {/* Quick fill helper buttons for grading / demo */}
                    <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                        <button
                            type="button"
                            className="btn-panel-action"
                            style={{ fontSize: "11px", padding: "4px 8px" }}
                            onClick={() => handleQuickFill("supplier")}
                        >
                            Auto-fill Supplier Demo
                        </button>
                        <button
                            type="button"
                            className="btn-panel-action"
                            style={{ fontSize: "11px", padding: "4px 8px" }}
                            onClick={() => handleQuickFill("requester")}
                        >
                            Auto-fill Requester Demo
                        </button>
                    </div>

                    {/* Mode Toggle: Login vs Register */}
                    <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0", marginBottom: "20px" }}>
                        <button
                            id="tab-auth-login"
                            className={`nav-tab-item ${mode === "login" ? "active" : ""}`}
                            style={{ padding: "8px 16px" }}
                            onClick={() => { setMode("login"); setErrorMessage(""); }}
                        >
                            Sign In
                        </button>
                        <button
                            id="tab-auth-register"
                            className={`nav-tab-item ${mode === "register" ? "active" : ""}`}
                            style={{ padding: "8px 16px" }}
                            onClick={() => { setMode("register"); setErrorMessage(""); }}
                        >
                            Create Account
                        </button>
                    </div>

                    {/* Error Banner */}
                    {errorMessage && (
                        <div style={{ background: "#fee2e2", border: "1px solid #fecaca", color: "#b91c1c", padding: "10px 14px", borderRadius: "8px", fontSize: "13px", marginBottom: "16px" }}>
                            {errorMessage}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} id="auth-main-form">
                        {mode === "register" && (
                            <>
                                <div className="form-group">
                                    <label className="form-label" htmlFor="auth-name">Full Name</label>
                                    <input
                                        id="auth-name"
                                        name="name"
                                        type="text"
                                        required
                                        className="form-input"
                                        placeholder="e.g., Raymond Vance"
                                        value={formData.name}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="form-grid-2">
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="auth-org">
                                            {selectedRole === "supplier" ? "Business / Organization" : "Shelter / NGO Name"}
                                        </label>
                                        <input
                                            id="auth-org"
                                            name="organizationName"
                                            type="text"
                                            required
                                            className="form-input"
                                            placeholder="e.g., Grand Hyatt Catering"
                                            value={formData.organizationName}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label" htmlFor="auth-type">
                                            {selectedRole === "supplier" ? "Supplier Type" : "Requester Type"}
                                        </label>
                                        <input
                                            id="auth-type"
                                            name="accountType"
                                            type="text"
                                            className="form-input"
                                            placeholder={selectedRole === "supplier" ? "e.g., Catering / Restaurant" : "e.g., Homeless Shelter"}
                                            value={formData.accountType}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div className="form-grid-2">
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="auth-phone">
                                            Phone Number <span style={{ color: "#ef4444" }}>*</span>
                                        </label>
                                        <input
                                            id="auth-phone"
                                            name="phone"
                                            type="tel"
                                            required
                                            className="form-input"
                                            placeholder="+1 (555) 019-9922"
                                            value={formData.phone}
                                            onChange={handleChange}
                                        />
                                        <span style={{ fontSize: "11px", color: "#64748b", marginTop: "3px", display: "block" }}>
                                            Required for direct coordination & native calling.
                                        </span>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label" htmlFor="auth-location">Location / District</label>
                                        <input
                                            id="auth-location"
                                            name="location"
                                            type="text"
                                            required
                                            className="form-input"
                                            placeholder="e.g., Downtown District"
                                            value={formData.location}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Email */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="auth-email">Email Address</label>
                            <input
                                id="auth-email"
                                name="email"
                                type="email"
                                required
                                className="form-input"
                                placeholder="name@organization.com"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Password */}
                        <div className="form-group" style={{ position: "relative" }}>
                            <label className="form-label" htmlFor="auth-password">Password</label>
                            <div style={{ position: "relative" }}>
                                <input
                                    id="auth-password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    className="form-input"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                    style={{ paddingRight: "40px" }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}
                                    aria-label="Toggle password visibility"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password (Register mode) */}
                        {mode === "register" && (
                            <div className="form-group" style={{ position: "relative" }}>
                                <label className="form-label" htmlFor="auth-confirm-password">Confirm Password</label>
                                <div style={{ position: "relative" }}>
                                    <input
                                        id="auth-confirm-password"
                                        name="confirmPassword"
                                        type={showConfirmPassword ? "text" : "password"}
                                        required
                                        className="form-input"
                                        placeholder="••••••••"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        style={{ paddingRight: "40px" }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}
                                        aria-label="Toggle confirm password visibility"
                                    >
                                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            id="btn-auth-submit"
                            className={selectedRole === "supplier" ? "btn-publish-green" : "btn-publish-orange"}
                            style={{ width: "100%", marginTop: "12px", justifyContent: "center" }}
                            disabled={isSubmitting}
                        >
                            {isSubmitting
                                ? "Processing..."
                                : mode === "register"
                                ? `Register as ${selectedRole === "supplier" ? "Food Supplier" : "Food Requester"}`
                                : `Sign In as ${selectedRole === "supplier" ? "Food Supplier" : "Food Requester"}`}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AuthLanding;
