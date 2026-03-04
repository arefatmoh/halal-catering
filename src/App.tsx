import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import RegistrationPage from './pages/RegistrationPage';
import SuccessPage from './pages/SuccessPage';
import QRDisplayPage from './pages/QRDisplayPage';

// Admin Pages
import AdminLayout from './pages/admin/AdminLayout';
import DashboardPage from './pages/admin/DashboardPage';
import RegistrationsPage from './pages/admin/RegistrationsPage';
import ScannerPage from './pages/admin/ScannerPage';
import TablesPage from './pages/admin/TablesPage';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
        <Routes>
          {/* User Facing Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/register" element={<RegistrationPage />} />
          <Route path="/success" element={<SuccessPage />} />
          <Route path="/entry/:token" element={<QRDisplayPage />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="registrations" element={<RegistrationsPage />} />
            <Route path="scanner" element={<ScannerPage />} />
            <Route path="tables" element={<TablesPage />} />
          </Route>
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
