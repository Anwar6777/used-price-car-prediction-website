import json
from pydantic import BaseModel
from pathlib import Path
from fastapi.middleware.cors import CORSMiddleware

    
from fastapi import FastAPI, UploadFile, File, HTTPException
import pandas as pd
import numpy as np
import joblib

from pydantic import BaseModel

model_path = Path.cwd().joinpath("model/used_car_price_final.joblib")

app = FastAPI(
    title="Used Car Price Prediction API",
    version="1.0.0"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://used-price-car-prediction-website-2.onrender.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model
model_artifact = joblib.load(model_path)
model = model_artifact["model"]
smearing_factor = model_artifact["smearing_factor"]
metadata_path = Path(__file__).parent.joinpath("metadata.json")
print(metadata_path)
with open(metadata_path, "r", encoding="utf-8") as file:
    metadata = json.load(file)

from pydantic import BaseModel, Field, field_validator


class CarPredictionRequest(BaseModel):

    Brand: str = Field(..., min_length=1)
    model: str = Field(..., min_length=1)
    Age: int = Field(..., ge=0, le=50)
    kmDriven: float = Field(..., ge=0, le=1_000_000)
    Transmission: str = Field(..., min_length=1)
    Owner: str = Field(..., min_length=1)
    FuelType: str = Field(..., min_length=1)
    Varient: str | None = None
    EngineCapacity: float = Field(..., gt=0, le=10)

    @field_validator(
        "Brand",
        "model",
        "Transmission",
        "Owner",
        "FuelType"
    )
    @classmethod
    def validate_text_fields(cls, value):
        value = value.strip()

        if not value:
            raise ValueError("Field cannot be empty")

        return value

    @field_validator("Varient")
    @classmethod
    def validate_Varient(cls, value):
        if value is None:
            return None

        value = value.strip()

        return value if value else None
    
@app.get("/")
def home():

    return {
        "message": "Used Car Price Prediction API is running"
    }

@app.get("/metadata")
def get_metadata():

    preprocessor = model.named_steps["preprocessor"]

    categorical_pipeline = None

    for name, transformer, columns in preprocessor.transformers_:
        if name == "cat":
            categorical_pipeline = transformer
            break

    encoder = categorical_pipeline.named_steps["encoder"]
    categories = encoder.categories_

    brands = categories[0].tolist()
    models = categories[1].tolist()

    # Get the original training data used to build Brand → Model mapping
    data_path = Path.cwd().parent.joinpath(
        "ml-service/dataset",
        "used_cars_dataset_v2.csv"
    )

    df_metadata = pd.read_csv(data_path)

    # Apply the same Brand cleaning used during model development
    df_metadata.loc[
        df_metadata["Brand"] == "Toyota Land",
        "Brand"
    ] = "Toyota"

    # Apply the same model cleaning
    model_mapping = {
        "VentoTest": "Vento",
        "Motors FM Force One Test": "Force One",
        "Alto-800": "Alto 800",
        "Alto-K10": "Alto K10",
        "Celerio-X": "Celerio X",
        "S Cross": "S-Cross",
        "Scorpio-N": "Scorpio N",
        "Ssangyong-Rexton": "Ssangyong Rexton",
        "Swift-Dzire": "Swift Dzire",
        "Wagon-R": "Wagon R",
        "Vitara-Brezza": "Vitara Brezza",
        "WRV": "WR-V",
        "Zen-Estilo": "Zen Estilo",
        "A-class Limousine": "A-Class Limousine",
        "C Class": "C-Class",
        "G Class": "G-Class",
        "S-Cross1": "S-Cross",
        "maruti-suzuki-brezza": "Brezza",
        "maruti-suzuki-dzire": "Swift Dzire",
        "tata-punch": "Punch",
        "Motors FM Gurkha": "Gurkha",
        "Motors FM Trax Cruiser": "Trax Cruiser",
        "Hi-Lande Isuzu Hi-Lander": "Hi-Lander",
        "Five-door Thar": "Thar"
    }

    df_metadata["model"] = df_metadata["model"].replace(model_mapping)

    brand_model = {}

    for brand in brands:
        brand_models = (
            df_metadata.loc[
                df_metadata["Brand"] == brand,
                "model"
            ]
            .dropna()
            .unique()
            .tolist()
        )

        # Only include models that actually exist
        # in the final model encoder
        brand_models = sorted(
            set(brand_models).intersection(models)
        )

        brand_model[brand] = brand_models
    

    return {
        "Brand": sorted(brands),
        "model": sorted(models),
        "Varient": sorted(categories[5].tolist()),
        "brand_model": brand_model
    }
    
    
@app.post("/predict")
def predict_price(data: CarPredictionRequest):

    input_data = pd.DataFrame([{
        "Brand": data.Brand,
        "model": data.model,
        "Age": data.Age,
        "kmDriven": data.kmDriven,
        "Transmission": data.Transmission,
        "Owner": data.Owner,
        "FuelType": data.FuelType,
        "Varient": data.Varient if data.Varient else None,
        "EngineCapacity": data.EngineCapacity
    }])

    prediction_log = model.predict(input_data)[0]

    predicted_price = np.expm1(prediction_log)
    predicted_price = predicted_price * smearing_factor
    
    predicted_price_lakh = (
        predicted_price / 100000
    )

    return {
        "predicted_price": round(
            float(predicted_price),
            2
        ),
        "predicted_price_lakh": round(
            float(predicted_price_lakh),
            2
        )
    }   
    
@app.post("/predict-csv")
def predict_csv(file: UploadFile = File(...)):

    # Check file type
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="Only CSV files are allowed."
        )

    try:
        # Read uploaded CSV
        df = pd.read_csv(file.file)

        # Required columns
        required_columns = [
            "Brand",
            "model",
            "Age",
            "kmDriven",
            "Transmission",
            "Owner",
            "FuelType",
            "Varient",
            "EngineCapacity"
        ]

        # Check missing columns
        missing_columns = [
            column
            for column in required_columns
            if column not in df.columns
        ]

        if missing_columns:
            raise HTTPException(
                status_code=400,
                detail={
                    "message": "Missing required columns.",
                    "missing_columns": missing_columns
                }
            )

        # Keep only model input columns
        X = df[required_columns].copy()

        # Convert numeric columns
        X["Age"] = pd.to_numeric(
            X["Age"],
            errors="coerce"
        )

        X["kmDriven"] = pd.to_numeric(
            X["kmDriven"],
            errors="coerce"
        )

        X["EngineCapacity"] = pd.to_numeric(
            X["EngineCapacity"],
            errors="coerce"
        )

        # Empty Variant → None
        X["Varient"] = X["Varient"].replace(
            {np.nan: None}
        )

        # Make predictions
        prediction_log = model.predict(X)

        predicted_price = (
            np.expm1(prediction_log)
            * smearing_factor
        )

        predicted_price_lakh = (
            predicted_price / 100000
        )

        # Add predictions to dataframe
        df["predicted_price"] = np.round(
            predicted_price,
            2
        )

        df["predicted_price_lakh"] = np.round(
            predicted_price_lakh,
            2
        )

        # Convert NaN to None for JSON
        df = df.replace({np.nan: None})

        return {
            "count": len(df),
            "predictions": df.to_dict(
                orient="records"
            )
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"CSV prediction failed: {str(e)}"
        )
