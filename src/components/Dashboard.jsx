import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import AdminDashboard from './dashboards/AdminDashboard';
import DoctorDashboard from './dashboards/DoctorDashboard';
import PatientDashboard from './dashboards/PatientDashboard';

const Dashboard = () => {
  const { user } = useAuth();

  const renderDashboard = () => {
    switch (user?.role) {
      case 'admin':
        return <AdminDashboard />;
      case 'doctor':
        return <DoctorDashboard />;
      case 'patient':
        return <PatientDashboard />;
      default:
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
            <p className="text-gray-600 mt-2">Invalid user role</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome, {user?.name}
        </h1>
        <p className="text-gray-600">
          {user?.role === 'admin' && 'Manage hospital operations and oversee all activities.'}
          {user?.role === 'doctor' && 'View your appointments and manage patient care.'}
          {user?.role === 'patient' && 'Book appointments and view your medical records.'}
        </p>
      </div>
      
      {renderDashboard()}
    </div>
  );
};

export default Dashboard;