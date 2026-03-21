import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ExchangePage from './pages/ExchangePage';
import HistoryPage from './pages/HistoryPage';
import RatesPage from './pages/RatesPage';
import ProfilePage from './pages/ProfilePage';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh' }}><div className="spinner" style={{ width:36, height:36 }} /></div>;
  return user ? children : <Navigate to="/login" replace />;
};
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" replace /> : children;
};

const AppRoutes = () => (
  <>
    <Navbar />
    <Routes>
      <Route path="/"          element={<LandingPage />} />
      <Route path="/login"     element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register"  element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
      <Route path="/exchange"  element={<PrivateRoute><ExchangePage /></PrivateRoute>} />
      <Route path="/history"   element={<PrivateRoute><HistoryPage /></PrivateRoute>} />
      <Route path="/rates"     element={<RatesPage />} />
      <Route path="/profile"   element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
      <Route path="*"          element={<Navigate to="/" replace />} />
    </Routes>
  </>
);

export default function App() {
  return <AuthProvider><AppRoutes /></AuthProvider>;
}
