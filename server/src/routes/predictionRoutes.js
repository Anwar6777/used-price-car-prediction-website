const express = require("express");
const axios = require("axios");
const multer = require("multer");
const FormData = require("form-data");

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage()
});


// Single car prediction
router.post("/predict", async (req, res) => {
    try {

        const response = await axios.post(
            `${process.env.ML_SERVICE_URL}/predict`,
            req.body
        );

        res.json(response.data);

    } catch (error) {

        console.error(
            "Prediction service error:",
            error.response?.data || error.message
        );

        res.status(500).json({
            message: "Prediction service failed"
        });
    }
});


// CSV prediction
router.post(
    "/predict-csv",
    upload.single("file"),
    async (req, res) => {

        try {

            console.log("Received file:", req.file?.originalname);

            if (!req.file) {
                return res.status(400).json({
                    message: "CSV file was not received by Node"
                });
            }

            const formData = new FormData();

            formData.append(
                "file",
                req.file.buffer,
                {
                    filename: req.file.originalname,
                    contentType: "text/csv"
                }
            );

            console.log(
                "Sending file to:",
                `${process.env.ML_SERVICE_URL}/predict-csv`
            );

            const response = await axios.post(
                `${process.env.ML_SERVICE_URL}/predict-csv`,
                formData,
                {
                    headers: formData.getHeaders()
                }
            );

            res.json(response.data);

        } catch (error) {

            console.error(
                "CSV prediction service error:",
                error.response?.data || error.message
            );

            res.status(
                error.response?.status || 500
            ).json(
                error.response?.data || {
                    message: "CSV prediction service failed"
                }
            );
        }
    }
);


module.exports = router;