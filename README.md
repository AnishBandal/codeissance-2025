
# 🔐 LeadVault - Secure Lead Management System

[![Node.js](https://img.shields.io/badge/Node.js-16%2B-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-5.0%2B-green.svg)](https://mongodb.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9-blue.svg)](https://www.typescriptlang.org/)
[![PWA](https://img.shields.io/badge/PWA-Ready-purple.svg)](https://web.dev/progressive-web-apps/)

A comprehensive Lead Management System with enterprise-grade security features including Two-Factor Authentication (2FA), role-based access control, and offline capabilities.

## 🌟 Key Features

### 🔐 **Security & Authentication**
- ✅ **Two-Factor Authentication (2FA)** - TOTP compatible with Google/Microsoft Authenticator
- ✅ **Role-Based Access Control (RBAC)** - Higher Authority, Nodal Officers, Processing Staff
- ✅ **JWT Authentication** with secure token management
- ✅ **Password Hashing** with bcrypt
- ✅ **Backup Codes** for account recovery

### 👥 **User Management**
- ✅ **Multi-Role System** with granular permissions
- ✅ **Zone-Based Access** for regional lead management
- ✅ **User Registration** with approval workflow
- ✅ **Profile Management** with face verification
- ✅ **Audit Logging** for all user actions

### 📊 **Lead Management**
- ✅ **Lead Creation & Tracking** with status management
- ✅ **Offline Lead Creation** - PWA capabilities for offline data entry
- ✅ **Lead Assignment** based on zones and roles
- ✅ **Status Workflow** - New → Processing → Verified → Completed
- ✅ **Lead Search & Filtering** with advanced queries
- ✅ **Export Functionality** for reports

### 🎯 **Advanced Features**
- ✅ **Progressive Web App (PWA)** - Install on mobile/desktop
- ✅ **Face Verification** for enhanced security
- ✅ **Email Notifications** for lead updates
- ✅ **AI Scoring** for lead prioritization
- ✅ **Responsive Design** - Mobile-first approach
- ✅ **Real-time Updates** with optimistic UI

## 🏗️ Architecture

### Backend (Node.js + Express)
```
backend/
├── src/
│   ├── controllers/         # Request handlers
│   │   ├── authController.js
│   │   ├── leadController.js
│   │   ├── userController.js
│   │   └── twoFactorController.js
│   ├── models/             # MongoDB schemas
│   │   ├── User.js
│   │   ├── Lead.js
│   │   └── AuditLog.js
│   ├── routes/             # API endpoints
│   │   ├── auth.js
│   │   ├── leads.js
│   │   ├── users.js
│   │   └── twoFactor.js
│   ├── services/           # Business logic
│   │   ├── jwtService.js
│   │   ├── twoFactorService.js
│   │   └── emailService.js
│   ├── middleware/         # Auth, RBAC, validation
│   │   ├── authMiddleware.js
│   │   └── rbacMiddleware.js
│   └── config/            # Database, environment
├── package.json           # Dependencies
└── .env                  # Environment variables
```

### Frontend (React + TypeScript)
```
frontend/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── auth/         # Authentication components
│   │   ├── dashboard/    # Dashboard components
│   │   ├── layout/       # Layout components
│   │   └── ui/          # Base UI components
│   ├── pages/            # Route components
│   ├── contexts/         # State management
│   │   └── AuthContext.tsx
│   ├── services/         # API communication
│   │   ├── api.ts
│   │   └── authService.ts
│   ├── hooks/           # Custom React hooks
│   └── lib/             # Utilities
├── public/              # PWA assets
│   ├── manifest.json
│   └── sw.js
└── package.json        # Dependencies
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- MongoDB 5.0+
- npm or yarn

### 1. Clone Repository
```bash
git clone https://github.com/AnishBandal/codeissance-2025.git
cd codeissance-2025
git checkout feature/leadvault-complete-implementation
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env  # Configure your environment variables
npm run seed          # Create initial users and data
npm start             # Start backend server (port 5000)
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev           # Start development server (port 8080)
```

### 4. Environment Configuration
Create `.env` in backend directory:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/leadvault
# OR use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/leadvault

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=1h

# Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Cloudinary (Optional - for file uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## 🔐 Two-Factor Authentication Setup

### 🎉 **All Users Require 2FA**
Every user in the system now has 2FA enabled for maximum security.

### Admin Tools
```bash
cd backend

# Check all users and their 2FA status
node check-users.js

# Generate TOTP token for any user
node generate-user-totp.js username
```

### User Credentials (All require 2FA)
```
Higher Authority:
- Username: admin
- Password: Admin123!

Nodal Officers:
- Username: nodal_zone_a | Password: Nodal123!
- Username: nodal_zone_b | Password: Nodal123!

Processing Staff:
- Username: staff_alice | Password: Staff123!
- Username: staff_bob   | Password: Staff123!
- Username: staff_charlie | Password: Staff123!
- Username: staff_diana | Password: Staff123!
```

### Setting Up Authenticator Apps
1. Install Google Authenticator or Microsoft Authenticator
2. Login with credentials above
3. When 2FA form appears, use `generate-user-totp.js` to get current token
4. Or add account using "Enter a setup key" with provided secret

### Testing 2FA Flow
```bash
# Generate TOTP for any user
node generate-user-totp.js admin
node generate-user-totp.js nodal_zone_a  
node generate-user-totp.js staff_alice
```

## 📱 PWA Installation

### Desktop (Chrome/Edge)
1. Visit the application URL
2. Look for "Install" button in address bar
3. Click to install as desktop app

### Mobile (iOS/Android)
1. Open in Safari (iOS) or Chrome (Android)
2. Tap "Add to Home Screen"
3. App will work offline for lead creation

## 🛠️ Development Guide

### Role-Based Permissions

#### Current Role Hierarchy
```
Higher Authority (authority)
├── Full system access
├── User management
├── System configuration
└── All reports

Nodal Officer (nodal)
├── Zone-based lead access
├── Staff management in zone
├── Lead approval
└── Zone reports

Processing Staff (processing)
├── Lead creation/editing
├── Own leads only
├── Basic reports
└── Profile management
```

### Adding New Features

#### 1. Backend API Endpoint
```javascript
// backend/src/routes/newFeature.js
const express = require('express');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/rbacMiddleware');

const router = express.Router();

router.post('/new-endpoint', 
  authenticateToken, 
  requireRole(['authority', 'nodal']),
  async (req, res) => {
    // Your implementation
  }
);
```

#### 2. Frontend Service
```typescript
// frontend/src/services/newFeatureService.ts
import { apiClient } from './api';

export const newFeatureService = {
  async createSomething(data: any) {
    const response = await apiClient.post('/api/new-endpoint', data);
    return response.data;
  }
};
```

#### 3. React Component with 2FA Support
```typescript
// frontend/src/components/NewFeature.tsx
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const NewFeature: React.FC = () => {
  const { user, hasPermission, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <div>Please login</div>;
  }
  
  if (!hasPermission('new-feature')) {
    return <div>Access Denied</div>;
  }
  
  return (
    <div>Your component</div>
  );
};
```

## 📚 API Documentation

### Authentication Endpoints
```
POST /api/auth/login          # Username/password login
POST /api/auth/login-2fa      # 2FA verification
POST /api/auth/register       # User registration
POST /api/auth/logout         # Logout
GET  /api/auth/me            # Get current user
```

### 2FA Endpoints  
```
POST /api/2fa/setup          # Initialize 2FA setup
POST /api/2fa/enable         # Enable 2FA with verification
POST /api/2fa/disable        # Disable 2FA
POST /api/2fa/verify         # Verify TOTP token
```

### Lead Management
```
GET    /api/leads            # List leads (with filtering)
POST   /api/leads            # Create new lead
GET    /api/leads/:id        # Get lead details
PUT    /api/leads/:id        # Update lead
DELETE /api/leads/:id        # Delete lead
POST   /api/leads/:id/assign # Assign lead to user
```

### User Management
```
GET    /api/users            # List users (admin only)
POST   /api/users            # Create user (admin only)
PUT    /api/users/:id        # Update user
GET    /api/users/profile    # Get own profile
PUT    /api/users/profile    # Update own profile
```

## 🧪 Testing

### API Testing
Use the provided test scripts:
```bash
cd backend
node test-login.js         # Test authentication
node test2FA.js           # Test 2FA flow
node testLeadManagement.js # Test lead operations
```

### Manual Testing Checklist
- [ ] **Admin Login**: admin / Admin123! → 2FA → Admin Dashboard
- [ ] **Nodal Login**: nodal_zone_a / Nodal123! → 2FA → Nodal Dashboard
- [ ] **Staff Login**: staff_alice / Staff123! → 2FA → Staff Dashboard
- [ ] **PWA Install**: Install app on mobile/desktop
- [ ] **Offline Mode**: Create leads offline, sync when online
- [ ] **Role Permissions**: Verify access control for each role

## 🔧 Troubleshooting

### Common Issues

#### 2FA Not Working
```bash
# Check user 2FA status
node check-users.js

# Generate fresh TOTP token
node generate-user-totp.js username

# Verify authenticator app time sync
```

#### Database Connection
```bash
# Check MongoDB connection
mongosh "mongodb://localhost:27017/leadvault"

# For Atlas connection, check network access
```

#### Permission Errors
- Verify user roles in AuthContext
- Check API endpoint middleware
- Ensure JWT token is valid

## 🚀 Deployment

### Production Environment Variables
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://prod-user:password@cluster.mongodb.net/leadvault-prod
JWT_SECRET=your-ultra-secure-production-jwt-secret-change-this
CORS_ORIGIN=https://your-frontend-domain.com
```

### Backend Deployment
```bash
npm run build
npm run start:prod
```

### Frontend Deployment
```bash
npm run build
# Serve dist/ directory with nginx or any static server
```

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Implement your feature with proper 2FA integration
4. Add tests and documentation
5. Create pull request

### Code Standards
- Use TypeScript for new frontend code
- Follow ESLint configuration
- Add proper error handling for 2FA flows
- Include role-based access control
- Write comprehensive tests

## 📄 Features Completed

### ✅ **Security Implementation**
- Two-Factor Authentication for all users
- JWT-based authentication
- Role-based access control
- Password hashing with bcrypt
- Secure session management

### ✅ **User Management**
- Multi-role system (Admin, Nodal, Staff)
- Zone-based permissions
- User profile management
- Face verification integration
- Audit logging

### ✅ **Lead Management**  
- Complete CRUD operations
- Offline lead creation (PWA)
- Status workflow management
- Zone-based lead filtering
- Export functionality

### ✅ **Progressive Web App**
- Service worker implementation
- Offline data storage
- Push notifications
- Mobile-responsive design
- Install prompts

### 🔄 **Ready for Integration**
This codebase is ready for other developers to integrate additional features such as:
- Advanced reporting dashboards
- Real-time notifications
- File upload system
- Integration APIs
- Custom workflows

## 📞 Support

For technical support:
- Check existing documentation above
- Review API endpoints and examples
- Test with provided credentials and tools
- Create issues for bugs or feature requests

---

**🎉 LeadVault - Enterprise-grade lead management with comprehensive 2FA security**

*Built with security, scalability, and developer experience in mind.*

*Last updated: September 27, 2025*

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