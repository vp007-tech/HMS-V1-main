import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';
import StatsCard from '../StatsCard';
import AppointmentList from '../appointments/AppointmentList';
import BillingManagement from '../billing/BillingManagement';

const DoctorDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState({
    todayAppointments: 0,
    totalAppointments: 0,
    completedAppointments: 0,
    upcomingAppointments: 0
  });
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      apiService.getCurrentUser().then(user => setUserRole(user.role)).catch(() => {});
    }
  }, []);

  useEffect(() => {
    loadDoctorData();
  }, []);

  const loadDoctorData = async () => {
    try {
      const appointmentsData = await apiService.getAppointments();
      setAppointments(appointmentsData);

      const today = new Date().toDateString();
      const todayAppointments = appointmentsData.filter(
        apt => new Date(apt.date).toDateString() === today
      );
      const completed = appointmentsData.filter(apt => apt.status === 'completed');
      const upcoming = appointmentsData.filter(
        apt => apt.status === 'scheduled' && new Date(apt.date) >= new Date()
      );

      setStats({
        todayAppointments: todayAppointments.length,
        totalAppointments: appointmentsData.length,
        completedAppointments: completed.length,
        upcomingAppointments: upcoming.length
      });
    } catch (error) {
      console.error('Error loading doctor data:', error);
    } finally {
      setLoading(false);
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
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Today's Appointments"
          value={stats.todayAppointments}
          icon="📅"
          color="blue"
        />
        <StatsCard
          title="Total Appointments"
          value={stats.totalAppointments}
          icon="📋"
          color="green"
        />
        <StatsCard
          title="Completed"
          value={stats.completedAppointments}
          icon="✅"
          color="purple"
        />
        <StatsCard
          title="Upcoming"
          value={stats.upcomingAppointments}
          icon="⏰"
          color="orange"
        />
      </div>

      {/* Appointments List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">My Appointments</h3>
        </div>
        <div className="p-6">
          <AppointmentList 
            appointments={appointments} 
            onUpdate={loadDoctorData}
            showPatientInfo={true}
            userRole="doctor"
          />
        </div>
      </div>

      {/* Billing Management for Doctors */}
      <div className="bg-white shadow rounded-lg mt-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Billing Management</h3>
        </div>
        <div className="p-6">
          <BillingManagement userRole="doctor" />
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
