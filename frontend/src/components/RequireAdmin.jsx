import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isAdminFromToken } from '../utils/adminGate';

const RequireAdmin = ({ children }) => {
  const location = useLocation();
  const token = localStorage.getItem('token');
  const admin = isAdminFromToken();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (!admin) {
    return <Navigate to="/home" replace />;
  }
  return children;
};

export default RequireAdmin;
