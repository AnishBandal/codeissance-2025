# LeadVault

A lead management system with AI-powered lead scoring.

## Project Structure

- `frontend/`: React PWA frontend
- `backend/`: Node.js REST API
- `ml_service/`: FastAPI ML microservice

## Getting Started

### Using Docker

1. Clone the repository
2. Create `.env` files in backend/ and ml_service/
3. Run `docker-compose up --build`

### Manual Setup

#### Frontend
```bash
cd frontend
npm install
npm start
```

#### Backend
```bash
cd backend
npm install
npm run dev
```

#### ML Service
```bash
cd ml_service
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Features

- Progressive Web App (PWA) support
- Role-based access control
- Offline data synchronization
- AI-powered lead scoring
- REST API backend
- ML microservice