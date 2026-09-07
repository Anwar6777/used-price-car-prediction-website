## 🚗 Used Car Price Prediction Platform
A professional, decoupled Machine Learning web ecosystem engineered to compute precise real estate valuations for the used car market in India. Built with a modular three-tier architecture, the platform features a responsive React Single-Page Application (SPA) front-end, a persistent logging and pipeline orchestration NodeJS Gateway back-end, and a specialized Python ML Microservice running optimized regression classifiers.
------------------------------
## 🏗 Visual System Architecture

       [ React UI Form Dashboard ]  ◄── (Vite Dev Server)
                    │
             Axios API Payload
                    ▼
       [ Express Routing Backend ]  ◄── (Node Engine)
              │             │
        Direct Logs   Forward Payload
              ▼             ▼
     [ .csv Storage ]  [ Flask Microservice ]  ◄── (Python Port)
                            │
                      Inference Engine
                            ▼
               [ Joblib Serialized Classifier Engine ]

------------------------------
## 📌 Project Overview
This ecosystem automates used car data collection, processes analytical variables tailored specifically to standard Indian car options (e.g., fuel types, variants, and millimeter engine capacities), and applies pre-trained mathematical matrices to calculate price estimations in Lakhs (₹).
## Platform Capabilities

* Interactive Diagnostics Form: Captures intrinsic details like exact variant types, kilometer runtime ranges, transaxle modes, and motor configurations through a web form.
* Automated Data Persistence Layer: Every calculation dynamically appends raw data telemetry and predicted cost variables to a local spreadsheet.
* Decoupled Deployment Readiness: Scalable isolated folders allow developers to modify interface themes without impacting core predictive algorithms.

------------------------------
## ✨ Features

* 🎛 React + Vite Interface Engine: Fast client-side rendering with hot module reloading.
* 📊 Automated CSV Database Logs: Persistent local storage writes variables to files via atomic stream appends.
* 🤖 Pre-trained Regression Pipeline: Machine learning back-end using serialized Scikit-learn pipelines.
* 🔒 CORS-Protected Handshakes: Secure token routing between the gateway layer and user applications.
* ⚙️ Calibrated Diagnostics: Tailored directly for Indian market data profiles, checking brand dependencies to ensure alignment (e.g., matching Audi trims with custom badges like "S Line" or "Technology" instead of competitor designations).

------------------------------
## 🧠 Machine Learning Engine

| Component Layer | Asset Designation & Technical Context |
|---|---|
| Framework Ecosystem | Python, Flask, Pandas, Scikit-Learn |
| Source Training Corpus | used_cars_dataset_v2.csv |
| Serialized Model Targets | Final_Linear_Model.pkl, used_car_price_final.joblib |

------------------------------
## 🛠 Tech Stack Matrix

 ┌──────────────┐      ┌──────────────┐      ┌──────────────┐      ┌──────────────┐
 │   Frontend   │─────►│  API Server  │─────►│  ML Engine   │─────►│ Local Storage│
 │              │      │              │      │              │      │              │
 │ • React.js   │      │ • Node.js    │      │ • Python 3   │      │ • Persistent │
 │ • Vite Comp  │      │ • Express    │      │ • Flask App  │      │   Spreadsheet│
 │ • PostCSS App│      │ • CORS Hand  │      │ • Joblib Core│      │ • Append-    │
 │ • Axios Conn │      │ • Dotenv Conf│      │ • Scikit-Lrn │      │   Field Log  │
 └──────────────┘      └──────────────┘      └──────────────┘      └──────────────┘

------------------------------
## 📂 Project Structure Map

used-car/
├── frontend/                     # React Client Application Layer
│   ├── public/                   # Asset resources & visual static items (car-icon.png)
│   ├── src/                      # Client application components
│   │   ├── App.css               # Styling declarations and UI element layouts
│   │   ├── App.jsx               # Main calculator interface state manager and form compiler
│   │   └── main.jsx              # Framework mount and element initialization entry point
│   ├── package.json              # Client runtime scripts and dependencies
│   └── vite.config.js            # Bundler configurations for development environments
│
├── server/                       # Node Proxy API Gateway Layer
│   ├── src/
│   │   └── routes/
│   │       └── predictionRoutes.js # Handles client payload ingestion and system forwarding
│   ├── server.js                 # Primary execution target spinning up Express pipeline layers
│   ├── car_price_predictions.csv # Live database file documenting transactional entries
│   └── package.json              # Gateway library manifests (CORS, Express, Dotenv)
│
└── ml-service/                   # Machine Learning Compute Microservice
    ├── dataset/                  # Contains operational matrices used during network setup
    │   └── used_cars_dataset_v2.csv
    ├── model/                    # Binaries exporting trained network constants
    │   ├── Final_Linear_Model.pkl
    │   └── used_car_price_final.joblib
    ├── app.py                    # Flask server endpoints mapping to model parameters
    └── requirements.txt          # Frozen library parameters for deployment verification

------------------------------
## 💻 Installation & Initialization Sequence
To launch the integrated workspace locally, clone the project files and open three independent terminal shells:
## Shell 1: Activate Machine Learning Engine
Navigate into the Python microservice directory, isolate the dependencies, and launch the Flask listener:

cd ml-service
pip install -r requirements.txt
python app.py

## Shell 2: Activate Gateway Router Controller
Run the Express framework from the secondary directory shell to map routing requests and handle log generation:

cd server
npm install
node server.js

## Shell 3: Initialize the Front-end Interface
Mount the React web canvas client from the front-end directory workspace:

cd frontend
npm install
npm run dev

------------------------------
## 📄 Application Data Formats## Payload Object Blueprint
Post endpoints process validation structures using the following raw JSON scheme:

{
  "Brand": "Audi",
  "model": "A3",
  "Age": 2,
  "kmDriven": 45000,
  "Transmission": "Automatic",
  "FuelType": "Petrol",
  "Varient": "Technology",
  "EngineCapacity": 1.4
}

------------------------------
## ⚠️ Disclaimer & Usage
Predictions are produced by an internal machine learning model trained on historical second-hand sales patterns. These figures are calculated as approximations for reference and should not be considered legal vehicle evaluations or binding appraisals.
------------------------------

## 👨‍💻 Developer

**Anwar Ansari**

MCA Student
Machine Learning & AI Enthusiast

GitHub: [https://github.com/Anwar6777](https://github.com/Anwar6777)

LinkedIn: [https://linkedin.com/in/anwar-ansari-945114b338](https://linkedin.com/in/anwar-ansari-945114b338)

Email: [anwaransari66763@gmail.com](mailto:anwaransari66763@gmail.com)

------------------------------
## ⚙️ Development Note
This system framework is organized into isolated component folders. When deploying to production environments, configure environmental endpoint paths in config.py and front-end connection managers to reflect changes in production addresses.
------------------------------
## 📜 License

This project is developed for educational and portfolio purposes. All rights reserved.
