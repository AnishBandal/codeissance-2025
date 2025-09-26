
/**
🔐 Project Overview: LeadVault (Secure Lead Management System)

Tech Stack:

Frontend: React PWA (Progressive Web App) with offline support using Service Workers & IndexedDB

Backend: Node.js + Express + MongoDB

AI Scoring: FastAPI microservice that returns a "Lead Conversion Probability" score (0–100) based on lead features

User Roles (RBAC):

Higher Authority

Nodal Officer (assigned to a zone)

Processing Staff (tied to a zone via their Nodal Officer)

Core Features:

Authentication with JWT

Role-Based Access Control:

Higher Authority can create Nodal Officers

Nodal Officers can create Processing Staff

Lead Management:

CRUD endpoints with audit logs

Zone-based data filtering

Staff can create leads (even offline — stored locally in PWA, synced later)

Smart Assignment:

Nodal Officers assign leads using AI recommendation (based on staff workload + proximity)

AI Scoring:

Backend sends lead data to FastAPI ML service

Returns a lead conversion probability score

Used to prioritize leads and display urgency

Folder Structure (Backend):

/src

/routes → All Express routes (auth, leads, users)

/controllers → Logic for handling requests

/models → Mongoose schemas (User, Lead, etc.)

/middleware → JWT auth and RBAC enforcement

/services → JWT signing, ML service integration

/config → MongoDB, env config

/utils → Password hashing helpers

app.js → Express app setup

index.js → Server entry point

Key Technologies:

bcrypt for password hashing

jsonwebtoken for access tokens

Express middleware for request auth

MongoDB for all data storage

FastAPI microservice for AI scoring

→ Now implement the Authentication logic (login + register + RBAC) below this overview
*/