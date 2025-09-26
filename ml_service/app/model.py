import joblib
from pathlib import Path

def load_model():
    model_path = Path(__file__).parent.parent / "lead_conversion_model.pkl"
    return joblib.load(model_path)

model = load_model()