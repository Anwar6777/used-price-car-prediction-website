import { useEffect, useMemo, useState } from "react";
import "./App.css";
const API_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000";

const ML_API_URL =
    import.meta.env.VITE_ML_API_URL || "http://127.0.0.1:8000";

const initialFormData = {
    Brand: "",
    model: "",
    Age: "",
    kmDriven: "",
    Transmission: "",
    Owner: "",
    FuelType: "",
    Varient: "",
    EngineCapacity: "",
};

function App() {
    const [formData, setFormData] = useState(initialFormData);

    const [metadata, setMetadata] = useState({
        Brand: [],
        model: [],
        Transmission: ["Automatic", "Manual"],
        Owner: ["first", "second"],
        FuelType: ["Diesel", "Petrol", "Hybrid/CNG"],
        Varient: [],
        brand_model: {},
    });

    const [prediction, setPrediction] = useState(null);
    const [csvFile, setCsvFile] = useState(null);
    const [csvPredictions, setCsvPredictions] = useState([]);
    const [csvLoading, setCsvLoading] = useState(false);
    const [csvError, setCsvError] = useState("");
    const [loading, setLoading] = useState(false);
    const [metadataLoading, setMetadataLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeSection, setActiveSection] = useState("home");

    useEffect(() => {
        const loadMetadata = async () => {
            try {
                setMetadataLoading(true);

                const response = await fetch(
                    `${ML_API_URL}/metadata`
                );

                if (!response.ok) {
                    throw new Error("Failed to load metadata");
                }

                const data = await response.json();

                console.log("Metadata received:", data);

                setMetadata({
                    Brand: Array.isArray(data.Brand)
                        ? data.Brand
                        : [],

                    model: Array.isArray(data.model)
                        ? data.model
                        : [],

                    Transmission: Array.isArray(data.Transmission)
                        ? data.Transmission
                        : ["Automatic", "Manual"],

                    Owner: Array.isArray(data.Owner)
                        ? data.Owner
                        : ["first", "second"],

                    FuelType: Array.isArray(data.FuelType)
                        ? data.FuelType
                        : ["Diesel", "Petrol", "Hybrid/CNG"],

                    Varient: Array.isArray(data.Varient)
                        ? data.Varient
                        : [],

                    brand_model:
                        data.brand_model &&
                            typeof data.brand_model === "object"
                            ? data.brand_model
                            : {},
                });

            } catch (error) {
                console.error("Metadata loading error:", error);
                setError("Unable to load vehicle data.");
            } finally {
                setMetadataLoading(false);
            }
        };

        loadMetadata();
    }, []);

    const availableModels =
        formData.Brand &&
            metadata.brand_model &&
            Array.isArray(metadata.brand_model[formData.Brand])
            ? metadata.brand_model[formData.Brand]
            : [];

    const handleChange = (event) => {
        const { name, value } = event.target;

        setError("");

        if (name === "Brand") {
            setFormData((previous) => ({
                ...previous,
                Brand: value,
                model: "",
            }));
            return;
        }

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const formatIndianPrice = (price) => {
        if (price >= 10000000) {
            return `₹ ${(price / 10000000).toFixed(2)} Crore`;
        }

        if (price >= 100000) {
            return `₹ ${(price / 100000).toFixed(2)} Lakh`;
        }

        return `₹ ${price.toLocaleString("en-IN", {
            maximumFractionDigits: 2,
        })}`;
    };

    const formatNumber = (number) => {
        return Number(number).toLocaleString("en-IN");
    };

    const handleCsvUpload = async (event) => {
        const file = event.target.files[0];

        setCsvError("");
        setCsvPredictions([]);

        if (!file) {
            setCsvFile(null);
            return;
        }

        if (!file.name.toLowerCase().endsWith(".csv")) {
            setCsvError("Please upload a CSV file.");
            event.target.value = "";
            return;
        }

        setCsvFile(file);
    };


    const handleCsvPredict = async () => {
        if (!csvFile) {
            setCsvError("Please select a CSV file first.");
            return;
        }

        try {
            setCsvLoading(true);
            setCsvError("");
            setCsvPredictions([]);

            const formData = new FormData();
            formData.append("file", csvFile);

            const response = await fetch(
                `${API_URL}/api/predict-csv`,
                {
                    method: "POST",
                    body: formData,
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data?.detail?.[0]?.msg ||
                    data?.message ||
                    "CSV prediction failed."
                );
            }

            console.log("CSV prediction response:", data);

            setCsvPredictions(data.predictions);

        } catch (err) {
            console.error("CSV prediction error:", err);

            setCsvError(
                err.message ||
                "Something went wrong while predicting the CSV."
            );
        } finally {
            setCsvLoading(false);
        }
    };

    const handleDownloadCsv = () => {
        if (!csvPredictions.length) {
            return;
        }

        const headers = Object.keys(csvPredictions[0]);

        const csvRows = [
            headers.join(","),

            ...csvPredictions.map((row) =>
                headers
                    .map((header) => {
                        const value = row[header];

                        if (value === null || value === undefined) {
                            return "";
                        }

                        // Escape commas, quotes and new lines
                        const stringValue = String(value);

                        if (
                            stringValue.includes(",") ||
                            stringValue.includes('"') ||
                            stringValue.includes("\n")
                        ) {
                            return `"${stringValue.replace(/"/g, '""')}"`;
                        }

                        return stringValue;
                    })
                    .join(",")
            ),
        ];

        const csvContent = csvRows.join("\n");

        const blob = new Blob(
            [csvContent],
            { type: "text/csv;charset=utf-8;" }
        );

        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");

        link.href = url;
        link.download = "car_price_predictions.csv";

        document.body.appendChild(link);

        link.click();

        document.body.removeChild(link);

        URL.revokeObjectURL(url);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError("");
        setPrediction(null);
        const age = Number(formData.Age);
        const kmDriven = Number(formData.kmDriven);
        const engineCapacity = Number(formData.EngineCapacity);

        if (age < 0 || age > 50) {
            setError("Age must be between 0 and 50 years.");
            return;
        }

        if (kmDriven < 0 || kmDriven > 1000000) {
            setError("Kilometers driven must be between 0 and 10,00,000.");
            return;
        }

        if (!engineCapacity || engineCapacity <= 0 || engineCapacity > 10) {
            setError("Engine capacity must be between 0 and 10 litres.");
            return;
        }

        if (!formData.Brand || !formData.model) {
            setError("Please select a brand and model.");
            return;
        }

        if (!formData.Transmission || !formData.Owner || !formData.FuelType) {
            setError("Please complete all required vehicle details.");
            return;
        }

        try {
            setLoading(true);

            const payload = {
                Brand: formData.Brand,
                model: formData.model,
                Age: age,
                kmDriven,
                Transmission: formData.Transmission,
                Owner: formData.Owner,
                FuelType: formData.FuelType,
                Varient: formData.Varient || null,
                EngineCapacity: engineCapacity,
            };

            const response = await fetch(`${API_URL}/api/predict`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();
            console.log("Prediction response:", data);
            console.log("Predicted price:", data.predicted_price);
            console.log("Predicted price lakh:", data.predicted_price_lakh);

            if (!response.ok) {
                const backendMessage =
                    data?.detail?.[0]?.msg ||
                    data?.message ||
                    "Prediction service failed.";

                throw new Error(backendMessage);
            }

            setPrediction(data);

            setTimeout(() => {
                document
                    .getElementById("result")
                    ?.scrollIntoView({ behavior: "smooth", block: "center" });
            }, 100);
        } catch (err) {
            setError(
                err.message ||
                "Something went wrong while generating the prediction."
            );
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData(initialFormData);
        setPrediction(null);
        setError("");
    };

    const scrollToSection = (section) => {
        setActiveSection(section);

        document
            .getElementById(section)
            ?.scrollIntoView({ behavior: "smooth" });
    };

    return (
        <div className="app">
            {/* ================= NAVBAR ================= */}

            <header className="navbar">
                <div className="nav-container">
                    <button
                        className="brand-logo"
                        onClick={() => scrollToSection("home")}
                    >
                        <span className="logo-icon">🚗</span>
                        <span>
                            <strong>CarValue</strong>
                            <small>AI</small>
                        </span>
                    </button>

                    <nav className="nav-links">
                        <button
                            className={activeSection === "home" ? "active" : ""}
                            onClick={() => scrollToSection("home")}
                        >
                            Home
                        </button>

                        <button
                            className={activeSection === "about" ? "active" : ""}
                            onClick={() => scrollToSection("about")}
                        >
                            About
                        </button>

                        <button
                            className={activeSection === "model" ? "active" : ""}
                            onClick={() => scrollToSection("model")}
                        >
                            Model
                        </button>
                    </nav>

                    <button
                        className="nav-cta"
                        onClick={() => scrollToSection("predict")}
                    >
                        Predict Price
                    </button>
                </div>
            </header>

            {/* ================= HERO ================= */}

            <main>
                <section id="home" className="hero">
                    <div className="hero-glow glow-one"></div>
                    <div className="hero-glow glow-two"></div>

                    <div className="hero-container">
                        <div className="hero-content">
                            <div className="hero-badge">
                                <span className="status-dot"></span>
                                Machine Learning Powered
                            </div>

                            <h1>
                                Know Your Car's
                                <span> Real Value.</span>
                            </h1>

                            <p className="hero-description">
                                Estimate the market value of your used car using a machine
                                learning model trained on real-world vehicle data.
                            </p>

                            <div className="hero-actions">
                                <button
                                    className="primary-button"
                                    onClick={() => scrollToSection("predict")}
                                >
                                    Predict My Car
                                    <span>→</span>
                                </button>

                                <button
                                    className="secondary-button"
                                    onClick={() => scrollToSection("about")}
                                >
                                    Learn More
                                </button>
                            </div>

                            <div className="hero-stats">
                                <div>
                                    <strong>82.83%</strong>
                                    <span>Test R² Score</span>
                                </div>

                                <div>
                                    <strong>₹1.88L</strong>
                                    <span>Mean Absolute Error</span>
                                </div>

                                <div>
                                    <strong>9</strong>
                                    <span>Vehicle Features</span>
                                </div>
                            </div>
                        </div>

                        <div className="hero-visual">
                            <div className="car-card">
                                <div className="car-card-top">
                                    <span>AI PRICE ESTIMATE</span>
                                    <span className="live-pill">LIVE</span>
                                </div>

                                <div className="car-illustration">
                                    <div className="car-shadow"></div>
                                    <div className="car-body">
                                        <div className="car-window front"></div>
                                        <div className="car-window back"></div>
                                        <div className="car-wheel wheel-one"></div>
                                        <div className="car-wheel wheel-two"></div>
                                        <div className="car-light"></div>
                                    </div>
                                </div>

                                <div className="car-card-bottom">
                                    <div>
                                        <span>Estimated value</span>
                                        <strong>₹ 8.52 Lakh</strong>
                                    </div>

                                    <div className="trend">
                                        <span>↗</span>
                                        <small>ML Estimate</small>
                                    </div>
                                </div>
                            </div>

                            <div className="floating-card floating-one">
                                <span>✓</span>
                                <div>
                                    <strong>Smart Prediction</strong>
                                    <small>Data-driven estimate</small>
                                </div>
                            </div>

                            <div className="floating-card floating-two">
                                <strong>9+</strong>
                                <small>Features analyzed</small>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ================= PREDICTION ================= */}

                <section id="predict" className="prediction-section">
                    <div className="section-container">
                        <div className="section-heading">
                            <span className="eyebrow">PRICE ESTIMATOR</span>
                            <h2>Tell us about your car</h2>
                            <p>
                                Enter the vehicle details below and our trained ML model will
                                estimate its value.
                            </p>
                        </div>

                        <div className="prediction-layout">
                            <div className="form-card">
                                <div className="form-card-header">
                                    <div>
                                        <span className="form-number">01</span>
                                        <h3>Vehicle Information</h3>
                                    </div>

                                    <span className="required-note">
                                        * Required fields
                                    </span>
                                </div>

                                {metadataLoading && (
                                    <div className="loading-metadata">
                                        <span className="spinner"></span>
                                        Loading vehicle data...
                                    </div>
                                )}

                                <form onSubmit={handleSubmit}>
                                    <div className="form-grid">
                                        <div className="field">
                                            <label>
                                                Brand <span>*</span>
                                            </label>

                                            <select
                                                name="Brand"
                                                value={formData.Brand}
                                                onChange={handleChange}
                                                disabled={metadataLoading}
                                                required
                                            >
                                                <option value="">Select brand</option>

                                                {metadata.Brand.map((brand) => (
                                                    <option key={brand} value={brand}>
                                                        {brand}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="field">
                                            <label>
                                                Model <span>*</span>
                                            </label>

                                            <select
                                                name="model"
                                                value={formData.model}
                                                onChange={handleChange}
                                                disabled={!formData.Brand || metadataLoading}
                                                required
                                            >
                                                <option value="">
                                                    {formData.Brand
                                                        ? "Select model"
                                                        : "Select brand first"}
                                                </option>

                                                {availableModels.map((model) => (
                                                    <option key={model} value={model}>
                                                        {model}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="field">
                                            <label>
                                                Vehicle Age <span>*</span>
                                            </label>

                                            <div className="input-with-unit">
                                                <input
                                                    type="number"
                                                    name="Age"
                                                    value={formData.Age}
                                                    onChange={handleChange}
                                                    min="0"
                                                    max="50"
                                                    placeholder="e.g. 5"
                                                    required
                                                />
                                                <span>years</span>
                                            </div>
                                        </div>

                                        <div className="field">
                                            <label>
                                                Kilometers Driven <span>*</span>
                                            </label>

                                            <div className="input-with-unit">
                                                <input
                                                    type="number"
                                                    name="kmDriven"
                                                    value={formData.kmDriven}
                                                    onChange={handleChange}
                                                    min="0"
                                                    max="1000000"
                                                    placeholder="e.g. 45000"
                                                    required
                                                />
                                                <span>km</span>
                                            </div>
                                        </div>

                                        <div className="field">
                                            <label>
                                                Transmission <span>*</span>
                                            </label>

                                            <select
                                                name="Transmission"
                                                value={formData.Transmission}
                                                onChange={handleChange}
                                                disabled={metadataLoading}
                                                required
                                            >
                                                <option value="">Select transmission</option>

                                                {metadata.Transmission.map((transmission) => (
                                                    <option
                                                        key={transmission}
                                                        value={transmission}
                                                    >
                                                        {transmission}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="field">
                                            <label>
                                                Owner <span>*</span>
                                            </label>

                                            <select
                                                name="Owner"
                                                value={formData.Owner}
                                                onChange={handleChange}
                                                disabled={metadataLoading}
                                                required
                                            >
                                                <option value="">Select owner</option>

                                                {metadata.Owner.map((owner) => (
                                                    <option
                                                        key={owner}
                                                        value={owner}
                                                    >
                                                        {owner}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="field">
                                            <label>
                                                Fuel Type <span>*</span>
                                            </label>

                                            <select
                                                name="FuelType"
                                                value={formData.FuelType}
                                                onChange={handleChange}
                                                disabled={metadataLoading}
                                                required
                                            >
                                                <option value="">Select fuel type</option>

                                                {metadata.FuelType.map((fuel) => (
                                                    <option
                                                        key={fuel}
                                                        value={fuel}
                                                    >
                                                        {fuel}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="field">
                                            <label>
                                                Engine Capacity <span>*</span>
                                            </label>

                                            <div className="input-with-unit">
                                                <input
                                                    type="number"
                                                    name="EngineCapacity"
                                                    value={formData.EngineCapacity}
                                                    onChange={handleChange}
                                                    min="0.1"
                                                    max="10"
                                                    step="0.1"
                                                    placeholder="e.g. 1.5"
                                                    required
                                                />
                                                <span>L</span>
                                            </div>
                                        </div>

                                        <div className="field full-width">
                                            <label>
                                                Varient <small>(Optional)</small>
                                            </label>

                                            <select
                                                name="Varient"
                                                value={formData.Varient}
                                                onChange={handleChange}
                                            >
                                                <option value="">Not specified</option>

                                                {metadata.Varient.map((Varient) => (
                                                    <option key={Varient} value={Varient}>
                                                        {Varient}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="error-message">
                                            <span>!</span>
                                            {error}
                                        </div>
                                    )}

                                    <div className="form-actions">
                                        <button
                                            type="button"
                                            className="reset-button"
                                            onClick={resetForm}
                                        >
                                            Reset
                                        </button>

                                        <button
                                            type="submit"
                                            className="predict-button"
                                            disabled={loading || metadataLoading}
                                        >
                                            {loading ? (
                                                <>
                                                    <span className="spinner"></span>
                                                    Predicting...
                                                </>
                                            ) : (
                                                <>
                                                    Predict Car Price
                                                    <span>→</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* RESULT CARD */}

                            <div
                                id="result"
                                className={`result-card ${prediction ? "has-result" : ""
                                    }`}
                            >
                                {prediction ? (
                                    <>
                                        <div className="result-top">
                                            <div className="success-icon">✓</div>
                                            <span>Prediction Complete</span>
                                        </div>

                                        <p className="result-label">
                                            Estimated Market Value
                                        </p>

                                        <h2 className="price">
                                            {formatIndianPrice(prediction.predicted_price)}
                                        </h2>

                                        <p className="price-secondary">
                                            ₹{" "}
                                            {formatNumber(
                                                Math.round(prediction.predicted_price)
                                            )}
                                        </p>

                                        <div className="result-divider"></div>

                                        <div className="result-car">
                                            <div className="mini-car">🚗</div>

                                            <div>
                                                <strong>
                                                    {formData.Brand} {formData.model}
                                                </strong>

                                                <span>
                                                    {formData.Age} year old ·{" "}
                                                    {formatNumber(formData.kmDriven)} km
                                                </span>
                                            </div>
                                        </div>

                                        <div className="confidence-note">
                                            <span>i</span>
                                            <p>
                                                This is an ML-based estimate and may differ from the
                                                actual selling price depending on market conditions,
                                                vehicle condition and other factors.
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <div className="empty-result">
                                        <div className="result-icon-large">₹</div>

                                        <span className="eyebrow">YOUR RESULT</span>

                                        <h3>Your estimated price will appear here</h3>

                                        <p>
                                            Complete the vehicle information and click{" "}
                                            <strong>Predict Car Price</strong> to get an
                                            AI-powered estimate.
                                        </p>

                                        <div className="result-features">
                                            <div>
                                                <span>✓</span>
                                                <p>Instant prediction</p>
                                            </div>

                                            <div>
                                                <span>✓</span>
                                                <p>Indian ₹ format</p>
                                            </div>

                                            <div>
                                                <span>✓</span>
                                                <p>ML powered</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="csv-prediction-card">


                            <div className="section-title">
                                <span className="section-number">02</span>
                                <h2>Predict prices from CSV</h2>
                            </div>

                            <p>
                                Upload a CSV file to predict prices for multiple vehicles.
                            </p>

                            <div className="csv-upload-area">

                                <input
                                    id="csv-upload"
                                    type="file"
                                    accept=".csv"
                                    onChange={handleCsvUpload}
                                />

                                <p className="csv-file-name">
                                    Selected file: <strong>{csvFile?.name || "No file selected"}</strong>
                                </p>

                                <button
                                    type="button"
                                    className="predict-button"
                                    onClick={handleCsvPredict}
                                    disabled={csvLoading}
                                >
                                    {csvLoading ? (
                                        <>
                                            <span className="spinner"></span>
                                            Predicting CSV...
                                        </>
                                    ) : (
                                        <>
                                            Predict CSV
                                            <span>→</span>
                                        </>
                                    )}
                                </button>

                            </div>

                            {csvError && (
                                <div className="error-message">
                                    <span>!</span>
                                    {csvError}
                                </div>
                            )}

                            {csvPredictions.length > 0 && (
                                <div className="csv-results">
                                    <div className="csv-results-header">
                                        <div>
                                            <h3>CSV Predictions</h3>
                                            <p>
                                                {csvPredictions.length} vehicles predicted
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            className="download-csv-button"
                                            onClick={handleDownloadCsv}
                                        >
                                            ↓ Download CSV
                                        </button>

                                    </div>

                                    <div className="csv-table-wrapper">
                                        <table className="csv-results-table">
                                            <thead>
                                                <tr>
                                                    <th>Brand</th>
                                                    <th>Model</th>
                                                    <th>Age</th>
                                                    <th>KM Driven</th>
                                                    <th>Varient</th>
                                                    <th>Predicted Price</th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {csvPredictions.map((car, index) => (
                                                    <tr key={index}>
                                                        <td>{car.Brand}</td>
                                                        <td>{car.model}</td>
                                                        <td>{car.Age}</td>
                                                        <td>
                                                            {Number(car.kmDriven).toLocaleString("en-IN")} km
                                                        </td>
                                                        <td>
                                                            {car.Varient || "Not specified"}
                                                        </td>
                                                        <td className="csv-price">
                                                            ₹ {Number(car.predicted_price_lakh).toFixed(2)} Lakh
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </section>

                {/* ================= ABOUT ================= */}

                <section id="about" className="about-section">
                    <div className="section-container">
                        <div className="section-heading left">
                            <span className="eyebrow">ABOUT THE PROJECT</span>
                            <h2>Turning vehicle data into price predictions.</h2>
                            <p>
                                CarValue AI is a machine learning project designed to
                                estimate the market price of used vehicles from their
                                characteristics.
                            </p>
                        </div>

                        <div className="about-grid">
                            <div className="about-main-card">
                                <div className="about-icon">🧠</div>

                                <h3>What is CarValue AI?</h3>

                                <p>
                                    The system analyzes information such as brand, model,
                                    vehicle age, kilometers driven, transmission, ownership,
                                    fuel type, engine capacity and Varient to estimate a used
                                    car's price.
                                </p>

                                <p>
                                    The production model uses Linear Regression with a
                                    log-transformed target and a preprocessing pipeline for
                                    numerical and categorical features.
                                </p>
                            </div>

                            <div className="about-side-card">
                                <span className="card-label">THE PIPELINE</span>

                                <div className="pipeline-step">
                                    <span>01</span>
                                    <div>
                                        <strong>Vehicle Data</strong>
                                        <small>9 structured features</small>
                                    </div>
                                </div>

                                <div className="pipeline-line"></div>

                                <div className="pipeline-step">
                                    <span>02</span>
                                    <div>
                                        <strong>Preprocessing</strong>
                                        <small>Encoding + scaling + imputation</small>
                                    </div>
                                </div>

                                <div className="pipeline-line"></div>

                                <div className="pipeline-step">
                                    <span>03</span>
                                    <div>
                                        <strong>ML Prediction</strong>
                                        <small>Log-space Linear Regression</small>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="tech-section">
                            <span className="eyebrow">TECHNOLOGY STACK</span>

                            <div className="tech-grid">
                                <div className="tech-card">
                                    <strong>Python</strong>
                                    <span>ML Development</span>
                                </div>

                                <div className="tech-card">
                                    <strong>Scikit-learn</strong>
                                    <span>Machine Learning</span>
                                </div>

                                <div className="tech-card">
                                    <strong>FastAPI</strong>
                                    <span>ML API</span>
                                </div>

                                <div className="tech-card">
                                    <strong>React</strong>
                                    <span>Frontend</span>
                                </div>

                                <div className="tech-card">
                                    <strong>Node.js</strong>
                                    <span>Backend</span>
                                </div>

                                <div className="tech-card">
                                    <strong>Vite</strong>
                                    <span>Build Tool</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ================= MODEL ================= */}

                <section id="model" className="model-section">
                    <div className="section-container">
                        <div className="section-heading">
                            <span className="eyebrow">MODEL PERFORMANCE</span>
                            <h2>Built, tested and validated.</h2>
                            <p>
                                Performance metrics from the final frozen production model
                                evaluated on the untouched test set.
                            </p>
                        </div>

                        <div className="metrics-grid">
                            <div className="metric-card featured">
                                <span>R² SCORE</span>
                                <strong>0.8283</strong>
                                <small>Test set performance</small>
                            </div>

                            <div className="metric-card">
                                <span>LOG-SPACE R²</span>
                                <strong>0.9115</strong>
                                <small>Prediction stability</small>
                            </div>

                            <div className="metric-card">
                                <span>MAE</span>
                                <strong>₹1.88L</strong>
                                <small>Mean absolute error</small>
                            </div>

                            <div className="metric-card">
                                <span>RMSE</span>
                                <strong>₹6.45L</strong>
                                <small>Root mean squared error</small>
                            </div>
                        </div>

                        <div className="model-info">
                            <div>
                                <span>MODEL</span>
                                <strong>Linear Regression</strong>
                            </div>

                            <div>
                                <span>TARGET</span>
                                <strong>log1p(AskPrice)</strong>
                            </div>

                            <div>
                                <span>TRAINING DATA</span>
                                <strong>11,176 observations</strong>
                            </div>

                            <div>
                                <span>FEATURES</span>
                                <strong>9</strong>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ================= HOW IT WORKS ================= */}

                <section className="how-section">
                    <div className="section-container">
                        <div className="section-heading">
                            <span className="eyebrow">HOW IT WORKS</span>
                            <h2>Three simple steps.</h2>
                        </div>

                        <div className="steps-grid">
                            <div className="step-card">
                                <span className="step-number">01</span>
                                <div className="step-icon">🚘</div>
                                <h3>Enter details</h3>
                                <p>
                                    Provide the important specifications of the used vehicle.
                                </p>
                            </div>

                            <div className="step-card">
                                <span className="step-number">02</span>
                                <div className="step-icon">⚙️</div>
                                <h3>ML processes data</h3>
                                <p>
                                    The trained preprocessing pipeline transforms the vehicle
                                    information for the model.
                                </p>
                            </div>

                            <div className="step-card">
                                <span className="step-number">03</span>
                                <div className="step-icon">💰</div>
                                <h3>Get the estimate</h3>
                                <p>
                                    The model generates an estimated market value in Indian
                                    currency.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* ================= FOOTER ================= */}

            <footer className="footer">
                <div className="footer-container">
                    <div className="footer-brand">
                        <button
                            className="brand-logo"
                            onClick={() => scrollToSection("home")}
                        >
                            <span className="logo-icon">🚗</span>
                            <span>
                                <strong>CarValue</strong>
                                <small>AI</small>
                            </span>
                        </button>

                        <p>
                            Machine learning powered used-car price estimation.
                        </p>
                    </div>

                    <div className="footer-links">
                        <button onClick={() => scrollToSection("home")}>Home</button>
                        <button onClick={() => scrollToSection("predict")}>
                            Predictor
                        </button>
                        <button onClick={() => scrollToSection("about")}>About</button>
                        <button onClick={() => scrollToSection("model")}>
                            Model
                        </button>
                    </div>

                    <div className="footer-copy">
                        <span>ML Project · 2026</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default App;