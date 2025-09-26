# LeadVault Authentication System

## Overview
Complete JWT-based authentication system with Role-Based Access Control (RBAC) for LeadVault.

## Features
- ✅ JWT-based authentication
- ✅ Role-based access control (RBAC)
- ✅ Password hashing with bcrypt
- ✅ Token expiration (1 hour)
- ✅ User hierarchy enforcement
- ✅ Zone-based data access
- ✅ Security middleware
- ✅ Rate limiting
- ✅ Input validation

## User Roles & Hierarchy

### 1. Higher Authority (Level 3)
- Can create Nodal Officers
- Access to all zones
- Full system permissions

### 2. Nodal Officer (Level 2)  
- Can create Processing Staff in their zone
- Zone-restricted access
- Assigned to specific zone

### 3. Processing Staff (Level 1)
- Can only access their zone data
- Created by Nodal Officer
- Limited permissions

## API Endpoints

### Authentication Routes (`/api/auth`)

#### POST `/login`
Login with username and password.
```json
{
  "username": "john_doe",
  "password": "password123"
}
```

#### POST `/register`
Register new user (RBAC enforced).
```json
{
  "username": "new_user",
  "password": "password123",
  "role": "Processing Staff",
  "zone": "Zone-A"
}
```

#### POST `/create-nodal-officer`
Create Nodal Officer (Higher Authority only).
```json
{
  "username": "nodal_officer",
  "password": "password123",
  "zone": "Zone-B"
}
```

#### POST `/create-processing-staff`
Create Processing Staff (Nodal Officer only).
```json
{
  "username": "staff_member",
  "password": "password123"
}
```

#### GET `/profile`
Get current user profile (authenticated).

#### POST `/refresh`
Refresh JWT token (authenticated).

#### POST `/logout`
Logout user (client-side token removal).

## JWT Token Structure
```json
{
  "user_id": "64f1a2b3c4d5e6f7g8h9i0j1",
  "username": "john_doe",
  "role": "Nodal Officer",
  "zone": "Zone-A",
  "iat": 1677649200,
  "exp": 1677652800
}
```

## Middleware Usage

### Authentication Middleware
```javascript
const { authenticateToken } = require('./middleware/authMiddleware');

router.get('/protected-route', authenticateToken, (req, res) => {
  // req.user contains decoded JWT data
  res.json({ user: req.user });
});
```

### RBAC Middleware
```javascript
const { requireRole, ROLES } = require('./middleware/rbacMiddleware');

// Require specific role
router.post('/admin-only', 
  authenticateToken,
  requireRole(ROLES.HIGHER_AUTHORITY),
  controller.adminFunction
);

// Require multiple roles
router.get('/manager-access',
  authenticateToken,
  requireRole([ROLES.HIGHER_AUTHORITY, ROLES.NODAL_OFFICER]),
  controller.managerFunction
);
```

### Zone Access Control
```javascript
const { requireZoneAccess } = require('./middleware/rbacMiddleware');

router.get('/zone-data/:zone', 
  authenticateToken,
  requireZoneAccess((req) => req.params.zone),
  controller.getZoneData
);
```

## Environment Variables
Copy `.env.example` to `.env` and configure:

```bash
# Required
JWT_SECRET=your-super-secret-jwt-key
MONGODB_URI=mongodb://localhost:27017/leadvault

# Optional
JWT_EXPIRES_IN=1h
BCRYPT_ROUNDS=12
RATE_LIMIT_MAX_REQUESTS=100
```

## File Structure
```
src/
├── controllers/
│   └── authController.js      # Login, register, profile logic
├── middleware/
│   ├── authMiddleware.js      # JWT verification
│   └── rbacMiddleware.js      # Role-based access control
├── models/
│   └── User.js               # User schema with password hashing
├── routes/
│   └── auth.js               # Authentication routes
├── services/
│   └── jwtService.js         # JWT generation and verification
├── utils/
│   └── passwordUtils.js      # Password utilities
└── config/
    ├── db.js                 # MongoDB connection
    └── env.js                # Environment configuration
```

## Security Features

### Password Security
- Minimum 6 characters
- bcrypt hashing with 12 salt rounds
- Password strength validation
- Protection against common weak passwords

### JWT Security
- Short expiration time (1 hour)
- Secure secret key requirement
- Token verification on protected routes
- User activity validation

### Rate Limiting
- 100 requests per 15 minutes per IP
- Prevents brute force attacks
- Configurable limits

### CORS Protection
- Restricted origins
- Credential support
- Method and header restrictions

## Error Handling
Standardized error responses:
```json
{
  "success": false,
  "message": "Error description",
  "error": "ERROR_CODE",
  "details": ["Additional info"]
}
```

## Testing
```bash
# Install dependencies
npm install

# Run tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

## Usage Examples

### Creating Initial Higher Authority User
```javascript
// Run this once to create the first admin user
const User = require('./src/models/User');

const createAdmin = async () => {
  const admin = new User({
    username: 'admin',
    password: 'admin123',
    role: 'Higher Authority'
  });
  await admin.save();
  console.log('Admin user created');
};
```

### Client-side JWT Storage
```javascript
// Store token
localStorage.setItem('token', response.data.token);

// Include in requests
const token = localStorage.getItem('token');
const config = {
  headers: { Authorization: \`Bearer \${token}\` }
};
```

## Common Use Cases

### 1. User Registration Flow
1. Higher Authority creates Nodal Officer
2. Nodal Officer creates Processing Staff
3. Staff members can only access their zone data

### 2. Route Protection
```javascript
// Protect routes by role
app.use('/api/admin', requireRole(ROLES.HIGHER_AUTHORITY));
app.use('/api/nodal', requireRole([ROLES.HIGHER_AUTHORITY, ROLES.NODAL_OFFICER]));
```

### 3. Zone-based Data Filtering
```javascript
// Filter data by user's zone
const getUserZoneData = async (req, res) => {
  const query = req.user.role === ROLES.HIGHER_AUTHORITY 
    ? {} 
    : { zone: req.user.zone };
    
  const data = await Model.find(query);
  res.json(data);
};
```

## Next Steps
1. Implement lead management with zone filtering
2. Add audit logging for user actions
3. Implement password reset functionality
4. Add email verification for new users
5. Create user management dashboard