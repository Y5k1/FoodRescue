require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const donationRoutes = require("./routes/donationRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();

app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// Request logger for debugging & event stream visibility
app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
        const duration = Date.now() - start;
        console.log(`[Food-Donation-svc] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    });
    next();
});

app.get("/", (req, res) => {
    res.json({
        service: "FoodRescue Food Donation Service",
        status: "running",
        port: process.env.PORT || 5001,
        endpoints: {
            auth: "/api/auth",
            donations: "/api/donations",
            availableDonations: "/api/donations/available",
            stats: "/api/donations/stats"
        }
    });
});

app.get("/health", (req, res) => {
    const isConnected = mongoose.connection.readyState === 1;
    res.status(isConnected ? 200 : 503).json({
        service: "FoodRescue Food Donation Service",
        status: isConnected ? "healthy" : "unhealthy",
        port: Number(process.env.PORT) || 5001,
        database: isConnected ? "connected" : "disconnected",
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString()
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/donations", donationRoutes);

// Centralized error handling
app.use((err, req, res, next) => {
    console.error(`[Donation Error] ${err.name}: ${err.message}`);

    if (err.name === "ValidationError") {
        return res.status(400).json({
            success: false,
            message: Object.values(err.errors).map(val => val.message).join(", ")
        });
    }

    if (err.name === "CastError" || err.name === "BSONError") {
        return res.status(400).json({
            success: false,
            message: "Invalid resource identifier format"
        });
    }

    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return res.status(409).json({
            success: false,
            message: `A record with this ${field} already exists.`
        });
    }

    res.status(500).json({
        success: false,
        message: err.message || "Internal server error"
    });
});

const PORT = process.env.PORT || 5001;

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Food Donation Service running at http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error("Failed to start Food Donation Service:", err.message);
});