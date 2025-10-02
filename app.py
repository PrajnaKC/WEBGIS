from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import json
import random
import time

app = FastAPI()

# --- CORS Configuration (to allow frontend access) ---
origins = ["http://localhost:8000", "http://127.0.0.1:8000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Mock Database for Owner/Static Info ---
with open('mock_data.json', 'r') as f:
    # We only need the static owner info now
    mock_owner_data = json.load(f)

# --- Real-Time Machine Learning Model (Simulation) ---
def run_ml_model(plot_id: str):
    """
    This function simulates a real ML model.
    1. It would fetch a satellite image for the plot_id.
    2. It would run the image through a CNN (e.g., TensorFlow/PyTorch).
    3. It returns the predictions as a dictionary.
    """
    print(f"Running ML model for {plot_id}...")
    time.sleep(0.5)  # Simulate network/inference latency

    # Simulate different results each time
    land_types = ["Agricultural", "Homestead", "Fallow Land"]
    risks = ["Low", "Medium", "High"]
    fencing = ["Fenced", "Unfenced", "Partially Fenced"]

    ai_predictions = {
        "land_type": random.choice(land_types),
        "encroachment_risk": random.choice(risks),
        "fencing_status": random.choice(fencing)
    }
    print(f"ML Model Predictions: {ai_predictions}")
    return ai_predictions

# --- Real-Time Decision Support System (DSS) Engine ---
def run_dss_engine(analysis_data: dict):
    """
    This function simulates a DSS rules engine.
    It generates recommendations based on the combined data.
    """
    recommendations = []
    if analysis_data["ai_analysis"]["encroachment_risk"] in ["High", "Medium"]:
        recommendations.append("High encroachment risk detected. Flag for survey.")
    
    if analysis_data["ai_analysis"]["land_type"] == "Agricultural":
        recommendations.append("Eligible for agricultural subsidies.")
        
    if analysis_data["ai_analysis"]["fencing_status"] == "Unfenced":
        recommendations.append("Consider applying for fencing support schemes.")

    if not recommendations:
        return "No immediate risks or actions recommended."
    
    return " ".join(recommendations)

# --- API Endpoint ---
@app.get("/analyze_plot/{plot_id}")
async def analyze_plot(plot_id: str):
    """
    This endpoint orchestrates the real-time analysis pipeline.
    """
    print(f"--- New Request for Plot ID: {plot_id} ---")
    
    # 1. Get static owner data from our "database"
    owner_info = mock_owner_data.get(plot_id, mock_owner_data['default'])
    
    # 2. Run the real-time ML model
    ai_analysis_results = run_ml_model(plot_id)
    
    # 3. Combine static data and AI results
    full_analysis = {
        "owner_name": owner_info["owner_name"],
        "rtc_number": owner_info["rtc_number"],
        "ownership_status": owner_info["ownership_status"],
        "ai_analysis": ai_analysis_results
    }
    
    # 4. Run the DSS engine on the combined data
    dss_recommendation = run_dss_engine(full_analysis)
    full_analysis["dss_recommendation"] = dss_recommendation
    
    print("--- Request Complete. Sending data to frontend. ---")
    return full_analysis

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=5000)
