import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';
import StatsCard from '../StatsCard';
import AppointmentList from '../appointments/AppointmentList';
import BookAppointment from '../appointments/BookAppointment';
import Chatbot from '../chatbot/Chatbot';
import BillingManagement from '../billing/BillingManagement';

const PatientDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [bills, setBills] = useState([]);
  const [showBooking, setShowBooking] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [stats, setStats] = useState({
    totalAppointments: 0,
    upcomingAppointments: 0,
    completedAppointments: 0,
    pendingBills: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPatientData();
  }, []);

  const loadPatientData = async () => {
    try {
      const [appointmentsData, billsData] = await Promise.all([
        apiService.getAppointments(),
        apiService.getBills()
      ]);

      setAppointments(appointmentsData);
      setBills(billsData);

      const upcoming = appointmentsData.filter(
        apt => apt.status === 'scheduled' && new Date(apt.date) >= new Date()
      );
      const completed = appointmentsData.filter(apt => apt.status === 'completed');
      const pendingBills = billsData.filter(bill => bill.status === 'pending');

      setStats({
        totalAppointments: appointmentsData.length,
        upcomingAppointments: upcoming.length,
        completedAppointments: completed.length,
        pendingBills: pendingBills.length
      });
    } catch (error) {
      console.error('Error loading patient data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Appointments"
          value={stats.totalAppointments}
          icon="📋"
          color="blue"
        />
        <StatsCard
          title="Upcoming"
          value={stats.upcomingAppointments}
          icon="⏰"
          color="green"
        />
        <StatsCard
          title="Completed"
          value={stats.completedAppointments}
          icon="✅"
          color="purple"
        />
        <StatsCard
          title="Pending Bills"
          value={stats.pendingBills}
          icon="💰"
          color="red"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => setShowBooking(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            📅 Book Appointment
          </button>
          <button
            onClick={() => setShowChatbot(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            🤖 Medical Assistant
          </button>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            🔄 Refresh Data
          </button>
        </div>
      </div>

      {/* Appointments */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">My Appointments</h3>
        </div>
        <div className="p-6">
          <AppointmentList 
            appointments={appointments} 
            onUpdate={loadPatientData}
            showDoctorInfo={true}
          />
        </div>
      </div>

  {/* Recent Bills */}
  <BillingManagement userRole="patient" />

      {/* Modals */}
      {showBooking && (
        <BookAppointment
          onClose={() => setShowBooking(false)}
          onSuccess={() => {
            setShowBooking(false);
            loadPatientData();
          }}
        />
      )}

      {showChatbot && (
        <Chatbot
          onClose={() => setShowChatbot(false)}
        />
      )}
    </div>
  );
};

export default PatientDashboard;