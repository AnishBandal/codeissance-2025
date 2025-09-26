# 🔐 LeadVault – Secure Lead Management System

---

## **Project Overview**

**LeadVault** is a secure, role-based lead management system designed to streamline lead creation, assignment, and prioritization.  
It supports **offline-first functionality** for field staff, leverages **AI-powered scoring**, and enforces strict **access control**.

- **AI Scoring:** Returns **Lead Conversion Probability (0–100%)** and Loan Payment Reliability (0–100%)  
- **RBAC:** Role-Based Access Control ensures only authorized users perform specific actions.

---

## **Tech Stack**

- **Frontend:** React PWA (Progressive Web App)  
  - Offline support using **Service Workers** and **IndexedDB**
- **Backend:** Node.js + Express + MongoDB
- **AI Scoring:** FastAPI microservice
- **Authentication & Security:** JWT (JSON Web Tokens)

---

## **User Roles (RBAC)**

| Role                  | Description                                           |
|-----------------------|-------------------------------------------------------|
| **Higher Authority**   | Can create Nodal Officers, view all leads            |
| **Nodal Officer**      | Assigned to a zone, can create Processing Staff      |
| **Processing Staff**   | Tied to a Nodal Officer, can create leads (offline enabled) |

---

## **Core Features**

### **Authentication**
- JWT-based secure login and registration
- Password hashing with **bcrypt**

### **Role-Based Access Control**
- **Higher Authority:** create Nodal Officers, access all zones
- **Nodal Officers:** create Processing Staff for their zone
- **Processing Staff:** create leads, manage assigned leads

### **Lead Management**
- Full **CRUD** (Create, Read, Update, Delete) endpoints
- **Audit logs** for every action
- **Zone-based filtering** of leads
- Offline lead creation in PWA (syncs when online)

### **Smart Assignment**
- Nodal Officers assign leads using **AI recommendations**
  - Based on **staff workload**
  - **Proximity** to leads

### **AI Scoring**
- Backend sends lead data to **FastAPI ML service**
- Returns **Lead Conversion Probability (0–100%)**
- Used to **prioritize leads** and display urgency

---

## **AI Models**

### **1. Lead Conversion Prediction**
- Type: Binary Classification (Convert / Not Convert)
- Input Features:
  - Age, Experience, Income, Family, CC Spending, Education, Mortgage
- Output: Lead Conversion Probability → used for prioritization
- Threshold Mapping for Demo Visibility:
  - Probability ≥ 0.5 → Lead Score 50–100% → **Likely**
  - Probability < 0.5 → Lead Score 0–40% → **Unlikely**

### **2. Loan Payment Reliability**
- Type: Binary Classification (Pay / Default)
- Input Features:
  - Income, Education, Existing Loans, Lead Score
- Output: Probability of repayment (0–100%)
- Threshold Mapping:
  - ≥ 0.5 → High reliability
  - < 0.5 → Low reliability

---

## **Flowchart of Execution**

```text
[User Login/Register]
           |
           v
   [RBAC Verification]
           |
           v
[Lead Creation / Viewing / Assignment]
           |
           v
[Lead Data Sent to AI Service (FastAPI)]
           |
           v
[AI Models Predict Probabilities]
           |
           v
[Lead Conversion Score + Loan Payment Reliability]
           |
           v
[Backend Returns Scores & Categorization]
           |
           v
[Frontend Displays Likely / Unlikely / Borderline Leads]


---

## **Key Technologies**

- **bcrypt** → password hashing
- **jsonwebtoken** → access tokens
- **Express middleware** → request authentication
- **MongoDB** → database for all user and lead data
- **FastAPI** → AI scoring microservice

---

## **Next Steps**

- Implement **Authentication logic** (login, register, RBAC)
- Connect **AI scoring microservice** to backend
- Enable **offline-first PWA** lead creation and syncing
- Integrate **lead prioritization dashboards** for Nodal Officers and Higher Authority
