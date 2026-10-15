require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const requestRoutes = require("./routes/requestRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const app = express();

app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// Request logger for live debugging & visibility
app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
        const duration = Date.now() - start;
        console.log(`[Food-Request-svc] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    });
    next();
});

app.get("/", (req, res) => {
    res.json({
        service: "FoodRescue Food Request & Matching Service",
        status: "running",
        port: process.env.PORT || 5002,
        endpoints: {
            requests: "/api/requests",
            notifications: "/api/notifications",
            stats: "/api/requests/stats",
            events: "/api/requests/events"
        }
    });
});

const { getDonationServiceUrls } = require("./controllers/requestController");

app.get("/health", (req, res) => {
    const isConnected = mongoose.connection.readyState === 1;
    res.status(isConnected ? 200 : 503).json({
        service: "FoodRescue Food Request & Matching Service",
        status: isConnected ? "healthy" : "unhealthy",
        port: Number(process.env.PORT) || 5002,
        database: isConnected ? "connected" : "disconnected",
        donationServiceTargets: getDonationServiceUrls(),
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString()
    });
});

app.use("/api/requests", requestRoutes);
app.use("/api/notifications", notificationRoutes);

// Centralized error handling
app.use((err, req, res, next) => {
    console.error(`[Request Error] ${err.name}: ${err.message}`);

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

    res.status(500).json({
        success: false,
        message: err.message || "Internal server error"
    });
});

const PORT = process.env.PORT || 5002;

connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(
                `FoodRescue Request & Matching Service running at http://localhost:${PORT}`
            );
        });
    })
    .catch(error => {
        console.error("Failed to start FoodRescue Request Service:", error.message);
    });
