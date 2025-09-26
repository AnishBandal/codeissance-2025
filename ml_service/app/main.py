from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.predict import router as predict_router

app = FastAPI(title="LeadVault ML Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(predict_router, prefix="/api/predict", tags=["predictions"])

@app.get("/")
async def root():
    return {"message": "Welcome to LeadVault ML Service"}