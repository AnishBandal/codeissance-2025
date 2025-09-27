from flask import Flask, request, jsonify
import joblib
import pandas as pd
import numpy as np
import warnings

# Suppress sklearn version warnings
warnings.filterwarnings("ignore", category=UserWarning, module="sklearn")

# Initialize Flask app
app = Flask(__name__)

# Global variables for models
lead_model = None
lead_scaler = None
lead_label_encoder = None
repay_model = None
repay_scaler = None
repay_features = None

# Load trained models & tools with error handling
try:
    lead_model = joblib.load("./models/lead_model.pkl")
    lead_scaler = joblib.load("./models/lead_scaler.pkl")
    lead_label_encoder = joblib.load("./models/lead_label_encoder.pkl")
    repay_model = joblib.load("./models/repay_model.pkl")
    repay_scaler = joblib.load("./models/repay_scaler.pkl")
    repay_features = joblib.load("./models/repay_features.pkl")
    print("✅ All ML models loaded successfully")
except Exception as e:
    print(f"⚠️ Error loading ML models: {e}")
    print("🔄 Service will use fallback predictions")  


def fallback_prediction(data):
    """Generate fallback predictions when ML models are unavailable"""
    try:
        credit_score = float(data.get('creditScore', 650))
        customer_income = float(data.get('customerIncome', 500000))
        loan_amount = float(data.get('loanAmount', 1000000))
        customer_age = int(data.get('customerAge', 35))
        
        # Calculate lead score based on financial profile
        base_score = 50
        
        # Credit score impact (0-30 points)
        if credit_score > 750:
            base_score += 25
        elif credit_score > 700:
            base_score += 15
        elif credit_score > 650:
            base_score += 10
        elif credit_score > 600:
            base_score += 5
        
        # Income impact (0-20 points)
        if customer_income > 1000000:
            base_score += 20
        elif customer_income > 500000:
            base_score += 15
        elif customer_income > 300000:
            base_score += 10
        
        # Age factor (0-15 points)
        if 25 <= customer_age <= 45:
            base_score += 15
        elif 46 <= customer_age <= 60:
            base_score += 10
        
        # Loan-to-income ratio (-10 to +10 points)
        if customer_income > 0:
            ratio = loan_amount / customer_income
            if ratio < 3:
                base_score += 10
            elif ratio < 5:
                base_score += 5
            elif ratio > 8:
                base_score -= 10
        
        lead_score = max(30, min(95, int(base_score)))
        
        # Determine category based on score
        if lead_score >= 80:
            category = "Premium"
        elif lead_score >= 65:
            category = "High Priority"
        elif lead_score >= 50:
            category = "Standard"
        else:
            category = "Low Priority"
        
        # Repayment probability (lead_score + some variation)
        repayment_prob = min(95, lead_score + 5)
        repay_decision = "Yes" if repayment_prob >= 60 else "Maybe"
        
        return {
            "leadCategory": category,
            "leadScore": lead_score,
            "repaymentDecision": repay_decision,
            "repaymentProbability": repayment_prob
        }
    except Exception as e:
        return {
            "leadCategory": "Standard",
            "leadScore": 65,
            "repaymentDecision": "Yes",
            "repaymentProbability": 70
        }

# Define API route
@app.route("/predict", methods=["POST"])
def predict():
    try:
        # Parse JSON input
        data = request.get_json()
        print(f"🔮 Received prediction request: {data}")
        
        # Check if models are loaded
        if not all([lead_model, lead_scaler, lead_label_encoder, repay_model, repay_scaler, repay_features]):
            print("⚠️ Models not loaded, using fallback prediction")
            result = fallback_prediction(data)
            print(f"✅ Fallback prediction result: {result}")
            return jsonify(result)

        # Convert input to DataFrame
        input_df = pd.DataFrame([data])

        # Ensure numeric columns are properly parsed
        numeric_columns = ['priorityScore', 'creditScore', 'loanAmount', 'customerAge', 'customerIncome', 'leadAge', 'daysSinceUpdate']
        for column in numeric_columns:
            if column in input_df.columns:
                input_df[column] = (
                    input_df[column]
                    .astype(str)
                    .str.replace(r"[^0-9.\-]", "", regex=True)
                    .replace({'': '0'})
                )
            else:
                input_df[column] = 0
            input_df[column] = pd.to_numeric(input_df[column], errors='coerce').fillna(0)

        # Features for lead model
        lead_features = ['priorityScore', 'creditScore', 'loanAmount', 'customerAge', 'customerIncome', 'leadAge', 'daysSinceUpdate']
        lead_data = input_df.reindex(columns=lead_features, fill_value=0)

        # Scale & predict lead category
        lead_scaled = lead_scaler.transform(lead_data)
        lead_pred = lead_model.predict(lead_scaled)
        lead_category = lead_label_encoder.inverse_transform(lead_pred)[0]

        lead_probability = None
        if hasattr(lead_model, "predict_proba"):
            lead_probability = lead_model.predict_proba(lead_scaled)[0].max()

        lead_score = None
        if lead_probability is not None:
            lead_score = round(float(lead_probability) * 100, 2)
        elif np.isscalar(lead_pred[0]):
            lead_score = round(float(lead_pred[0]), 2)

        # Add leadScore to input for repayment model
        input_df['leadScore'] = lead_score if lead_score is not None else lead_pred[0]

        # Ensure repayment features are in correct order
        repay_data = input_df.reindex(columns=repay_features, fill_value=0)
        repay_data = repay_data.apply(pd.to_numeric, errors='coerce').fillna(0)
        repay_scaled = repay_scaler.transform(repay_data)
        repay_pred = repay_model.predict(repay_scaled)[0]

        repay_label = "Yes" if repay_pred == 1 else "No"
        repay_probability = None
        if hasattr(repay_model, "predict_proba"):
            repay_probability = repay_model.predict_proba(repay_scaled)[0][1]

        repayment_probability_percent = None
        if repay_probability is not None:
            repayment_probability_percent = round(float(repay_probability) * 100, 2)

        result = {
            "leadCategory": str(lead_category),
            "leadScore": float(lead_score) if lead_score is not None else 65.0,
            "repaymentDecision": str(repay_label),
            "repaymentProbability": float(repayment_probability_percent) if repayment_probability_percent is not None else 70.0
        }
        
        print(f"✅ ML prediction result: {result}")
        return jsonify(result)

    except Exception as e:
        print(f"❌ Prediction error: {e}")
        # Return fallback prediction on error
        result = fallback_prediction(data if 'data' in locals() else {})
        print(f"✅ Error fallback result: {result}")
        return jsonify(result)


@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint"""
    models_status = {
        "lead_model": lead_model is not None,
        "lead_scaler": lead_scaler is not None,
        "lead_label_encoder": lead_label_encoder is not None,
        "repay_model": repay_model is not None,
        "repay_scaler": repay_scaler is not None,
        "repay_features": repay_features is not None
    }
    
    all_loaded = all(models_status.values())
    
    return jsonify({
        "status": "healthy" if all_loaded else "degraded",
        "models_loaded": models_status,
        "using_fallback": not all_loaded,
        "service": "ML Prediction Service",
        "version": "1.0.0"
    })

# Run Flask app
if __name__ == "__main__":
    print("🚀 Starting ML Prediction Service on port 3001...")
    app.run(host="0.0.0.0", port=3001, debug=True)
