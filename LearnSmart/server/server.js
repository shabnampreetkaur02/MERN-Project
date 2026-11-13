require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const courseRoutes = require("./routes/courseRoutes");
const adminRoutes = require("./routes/adminRoutes");
const enrollmentRoutes = require("./routes/enrollmentRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");

if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
    console.error("Missing MONGO_URI or JWT_SECRET. Copy .env.example to .env and fill them in.");
    process.exit(1);
}

const app = express();

// CLIENT_URL can hold one or more allowed origins separated by commas.
// If it is not set, any origin is allowed (fine for local development).
const allowedOrigins = process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(",").map((origin) => origin.trim())
    : null;

app.use(cors(allowedOrigins ? { origin: allowedOrigins } : undefined));
app.use(express.json({ limit: "1mb" }));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/recommendations", recommendationRoutes);

app.get("/", (req, res) => {
    res.send("Welcome to LearnSmart API!");
});

// Unknown route
app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
});

// Last-resort error handler (for example, invalid JSON in the request body)
app.use((error, req, res, next) => {
    const status = error.status || 500;

    if (status >= 500) console.error("Unhandled error:", error);

    res.status(status).json({
        message: status >= 500 ? "Something went wrong on the server" : error.message
    });
});

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB Connected Successfully");

        app.listen(PORT, () => {
            console.log(`LearnSmart server running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error("MongoDB connection error:", error.message);
        process.exit(1);
    });
