from flask import Flask, request, jsonify
import joblib
import pandas as pd
import numpy as np

# Initialize Flask app
app = Flask(__name__)


# Load trained models & tools
# Lead conversion model (choose one – LogisticRegression / RandomForest / GradientBoosting)
lead_model = joblib.load("./models/lead_model.pkl")
lead_scaler = joblib.load("./models/lead_scaler.pkl")
lead_label_encoder = joblib.load("./models/lead_label_encoder.pkl")

# Repayment model
repay_model = joblib.load("./models/repay_model.pkl")
repay_scaler = joblib.load("./models/repay_scaler.pkl")
repay_features = joblib.load("./models/repay_features.pkl")  


# Define API route
@app.route("/predict", methods=["POST"])
def predict():
    try:
        # Parse JSON input
        data = request.get_json()

        # Convert input to DataFrame
        input_df = pd.DataFrame([data])

        # Features for lead model
        lead_features = ['priorityScore','creditScore','loanAmount',
                         'customerAge','customerIncome','leadAge','daysSinceUpdate']
        lead_data = input_df[lead_features]

        # Scale & predict lead category
        lead_scaled = lead_scaler.transform(lead_data)
        lead_pred = lead_model.predict(lead_scaled)
        lead_category = lead_label_encoder.inverse_transform(lead_pred)[0]

        # Add leadScore to input for repayment model
        # (leadScore can be the encoded numeric class of lead_category)
        input_df['leadScore'] = lead_pred[0]

        # Ensure repayment features are in correct order
        repay_data = input_df[repay_features]
        repay_scaled = repay_scaler.transform(repay_data)
        repay_pred = repay_model.predict(repay_scaled)[0]

        repay_label = "Yes" if repay_pred == 1 else "No"

        # Return JSON response
        return jsonify({
            "leadCategory": lead_category,
            "repaymentProb": repay_label
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 400


# Run Flask app
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=3001, debug=True)
