import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

export default function ProtectedRoute() {
  const accessToken = sessionStorage.getItem('accessToken');

  // If no token, redirect to login; else render child routes
  return accessToken ? <Outlet /> : <Navigate to="/login" />;
}
