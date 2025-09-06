import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';
import StatsCard from '../StatsCard';
import PatientManagement from '../patients/PatientManagement';
import DoctorManagement from '../doctors/DoctorManagement';
import AppointmentManagement from '../appointments/AppointmentManagement';
import BillingManagement from '../billing/BillingManagement';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalDoctors: 0,
    totalAppointments: 0,
    pendingBills: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [patients, doctors, appointments, bills] = await Promise.all([
        apiService.getPatients(),
        apiService.getDoctors(),
        apiService.getAppointments(),
        apiService.getBills()
      ]);

      setStats({
        totalPatients: patients.length,
        totalDoctors: doctors.length,
        totalAppointments: appointments.length,
        pendingBills: bills.filter(bill => bill.status === 'pending').length
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'patients', name: 'Patients', icon: '👥' },
    { id: 'doctors', name: 'Doctors', icon: '👨‍⚕️' },
    { id: 'appointments', name: 'Appointments', icon: '📅' },
    { id: 'billing', name: 'Billing', icon: '💰' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title="Total Patients"
              value={stats.totalPatients}
              icon="👥"
              color="blue"
            />
            <StatsCard
              title="Total Doctors"
              value={stats.totalDoctors}
              icon="👨‍⚕️"
              color="green"
            />
            <StatsCard
              title="Appointments"
              value={stats.totalAppointments}
              icon="📅"
              color="purple"
            />
            <StatsCard
              title="Pending Bills"
              value={stats.pendingBills}
              icon="💰"
              color="red"
            />
          </div>
        );
      case 'patients':
        return <PatientManagement />;
      case 'doctors':
        return <DoctorManagement />;
      case 'appointments':
        return <AppointmentManagement />;
      case 'billing':
        return <BillingManagement />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>
        
        <div className="p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
