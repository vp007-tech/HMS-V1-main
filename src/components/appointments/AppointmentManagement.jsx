import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';
import AppointmentList from './AppointmentList';
import BookAppointment from './BookAppointment';

const AppointmentManagement = () => {
  const [appointments, setAppointments] = useState([]);
  const [showBooking, setShowBooking] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      const data = await apiService.getAppointments();
      setAppointments(data);
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading appointments...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">All Appointments</h3>
        <button
          onClick={() => setShowBooking(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-colors"
        >
          📅 Book New Appointment
        </button>
      </div>

      {/* Appointments List */}
      <AppointmentList 
        appointments={appointments} 
        onUpdate={loadAppointments}
        showPatientInfo={true}
        showDoctorInfo={true}
      />

      {/* Book Appointment Modal */}
      {showBooking && (
        <BookAppointment
          onClose={() => setShowBooking(false)}
          onSuccess={() => {
            setShowBooking(false);
            loadAppointments();
          }}
        />
      )}
    </div>
  );
};

export default AppointmentManagement;
