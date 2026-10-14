import React from "react";
import { useApp } from "../context/AppContext";
import { Utensils, Clock, Users, Leaf, TrendingUp, CheckCircle2 } from "lucide-react";

export const StatCards = () => {
    const { stats } = useApp();

    const formatNumber = (num) => {
        return (num || 0).toLocaleString();
    };

    return (
        <section className="stats-grid" id="stats-section" aria-label="Platform Metrics">
            {/* Card 1: Total Meals Rescued */}
            <div className="stat-card" id="card-meals-rescued">
                <div className="stat-icon-wrapper green">
                    <Utensils size={22} strokeWidth={2.2} />
                </div>
                <div className="stat-content">
                    <span className="stat-label">Total Meals Rescued</span>
                    <span className="stat-number">{formatNumber(stats.totalMealsRescued)}</span>
                    <span className="stat-subtext positive">
                        <TrendingUp size={13} />
                        <span>+14% from last week</span>
                    </span>
                </div>
            </div>

            {/* Card 2: Active Donations */}
            <div className="stat-card" id="card-active-donations">
                <div className="stat-icon-wrapper amber">
                    <Clock size={22} strokeWidth={2.2} />
                </div>
                <div className="stat-content">
                    <span className="stat-label">Active Donations</span>
                    <span className="stat-number">{stats.activeDonations}</span>
                    <span className="stat-subtext">Awaiting local claim</span>
                </div>
            </div>

            {/* Card 3: Open NGO Requests */}
            <div className="stat-card" id="card-open-requests">
                <div className="stat-icon-wrapper blue">
                    <Users size={22} strokeWidth={2.2} />
                </div>
                <div className="stat-content">
                    <span className="stat-label">Open NGO Requests</span>
                    <span className="stat-number">{stats.openNgoRequests}</span>
                    <span className="stat-subtext">Ready for match</span>
                </div>
            </div>

            {/* Card 4: CO2 Waste Prevented */}
            <div className="stat-card" id="card-co2-prevented">
                <div className="stat-icon-wrapper teal">
                    <Leaf size={22} strokeWidth={2.2} />
                </div>
                <div className="stat-content">
                    <span className="stat-label">CO₂ Waste Prevented</span>
                    <span className="stat-number">{formatNumber(stats.co2WastePreventedKg)} kg</span>
                    <span className="stat-subtext positive">
                        <CheckCircle2 size={13} />
                        <span>Eco-Impact Verified</span>
                    </span>
                </div>
            </div>
        </section>
    );
};

export default StatCards;
