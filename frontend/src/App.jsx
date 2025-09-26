import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './components/Login';
import StaffDashboard from './pages/StaffDashboard';
import NodalOfficerDashboard from './pages/NodalOfficerDashboard';
import HigherAuthorityDashboard from './pages/HigherAuthorityDashboard';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/staff" element={<StaffDashboard />} />
          <Route path="/nodal" element={<NodalOfficerDashboard />} />
          <Route path="/authority" element={<HigherAuthorityDashboard />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;