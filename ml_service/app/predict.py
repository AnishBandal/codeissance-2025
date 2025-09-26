from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.model import model
import numpy as np

router = APIRouter()

class LeadData(BaseModel):
    features: list[float]

@router.post("/")
async def predict_lead_conversion(data: LeadData):
    try:
        prediction = model.predict_proba([data.features])[0]
        return {"conversion_probability": float(prediction[1])}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))