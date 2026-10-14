import React from "react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { Sparkles, ArrowRight, Utensils, Plus, Inbox } from "lucide-react";

export const HeroBanner = () => {
    const { setIsDonationModalOpen, setActiveTab } = useApp();
    const { user, isAuthenticated } = useAuth();

    const isSupplier = user?.role === "supplier";
    const isRequester = user?.role === "requester";

    return (
        <section className="hero-banner-card" id="hero-banner">
            <div className="hero-badge">
                <Sparkles size={12} />
                <span>Sustainable Microservice Architecture</span>
            </div>

            <h1 className="hero-title">
                {isSupplier
                    ? "Redistribute Your Commercial Surplus to Local Shelters in Real-Time"
                    : isRequester
                    ? "Access Nutritious Surplus Food for Your Community Kitchen & Shelter"
                    : "Connecting Surplus Food Donors with Local Shelters in Real-Time"}
            </h1>

            <p className="hero-description">
                FoodRescue utilizes a RESTful microservices backend connecting campus canteens,
                restaurants, and caterers with community kitchens through automated algorithmic proximity matching
                and safe, concurrency-locked reservations.
            </p>

            <div className="hero-actions">
                {isSupplier ? (
                    <>
                        <button
                            id="btn-hero-post-food"
                            className="btn-hero-primary"
                            onClick={() => setIsDonationModalOpen(true)}
                        >
                            <Plus size={15} style={{ display: "inline", marginRight: "6px" }} />
                            Post Surplus Food
                        </button>
                        <button
                            id="btn-hero-view-incoming"
                            className="btn-hero-secondary"
                            onClick={() => setActiveTab("incoming-requests")}
                        >
                            <Inbox size={15} style={{ display: "inline", marginRight: "6px" }} />
                            Review Incoming Requests
                        </button>
                    </>
                ) : isRequester ? (
                    <>
                        <button
                            id="btn-hero-browse-food"
                            className="btn-hero-primary"
                            onClick={() => setActiveTab("browse-food")}
                        >
                            <Utensils size={15} style={{ display: "inline", marginRight: "6px" }} />
                            Browse Available Food
                        </button>
                        <button
                            id="btn-hero-my-requests"
                            className="btn-hero-secondary"
                            onClick={() => setActiveTab("my-requests")}
                        >
                            My Submitted Requests
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            id="btn-hero-post-food"
                            className="btn-hero-primary"
                            onClick={() => setIsDonationModalOpen(true)}
                        >
                            Post Surplus Food
                        </button>
                        <button
                            id="btn-hero-browse-food"
                            className="btn-hero-secondary"
                            onClick={() => setActiveTab("browse-food")}
                        >
                            Browse Available Food
                        </button>
                    </>
                )}
            </div>
        </section>
    );
};

export default HeroBanner;
