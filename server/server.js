require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

const PORT = process.env.PORT || 5000;

app.use(
    cors({
        origin: process.env.FRONTEND_URL
    })
);

app.use(express.json());

const predictionRoutes = require("./src/routes/predictionRoutes");

app.use("/api", predictionRoutes);

app.get("/", (req, res) => {
    res.json({ message: "Used Car Price Prediction API is running" });
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});
