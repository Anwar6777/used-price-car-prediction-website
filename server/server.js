require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

const PORT = process.env.PORT
const FRONTEND_URL =
    process.env.FRONTEND_URL;

app.use(
    cors({
        origin: FRONTEND_URL,
    })
);

app.use(express.json());

const predictionRoutes = require("./src/routes/predictionRoutes");

app.use("/api", predictionRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});