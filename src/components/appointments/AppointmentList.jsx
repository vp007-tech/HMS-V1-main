import React, { useState } from 'react';
import apiService from '../../services/api';

import CreateBill from '../billing/CreateBill';

const AppointmentList = ({ appointments, onUpdate, showPatientInfo = false, showDoctorInfo = false, userRole: userRoleProp }) => {
  const [updatingId, setUpdatingId] = useState(null);
  const [userRole, setUserRole] = useState(userRoleProp || '');
  const [showCreateBill, setShowCreateBill] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  React.useEffect(() => {
    if (!userRoleProp) {
      const token = localStorage.getItem('token');
      if (token) {
        apiService.getCurrentUser().then(user => setUserRole(user.role)).catch(() => {});
      }
    } else {
      setUserRole(userRoleProp);
    }
  }, [userRoleProp]);

  const handleStatusUpdate = async (appointmentId, newStatus) => {
    setUpdatingId(appointmentId);
    try {
      if (userRole === 'doctor' && newStatus === 'completed') {
        await apiService.completeAppointment(appointmentId);
      } else {
        await apiService.updateAppointment(appointmentId, { status: newStatus });
      }
      onUpdate();
    } catch (error) {
      console.error('Error updating appointment:', error);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCancel = async (appointmentId) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      setUpdatingId(appointmentId);
      try {
        await apiService.cancelAppointment(appointmentId);
        onUpdate();
      } catch (error) {
        console.error('Error cancelling appointment:', error);
      } finally {
        setUpdatingId(null);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'no-show':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (appointments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No appointments found
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {showPatientInfo && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
            )}
            {showDoctorInfo && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
            )}
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {appointments.map((appointment) => (
            <tr key={appointment._id} className="hover:bg-gray-50">
              {showPatientInfo && (
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{appointment.patientId?.userId?.name || 'N/A'}</td>
              )}
              {showDoctorInfo && (
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {appointment.doctorId?.userId?.name || 'N/A'}<br />
                  <span className="text-xs text-gray-500">{appointment.doctorId?.specialization}</span>
                </td>
              )}
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {new Date(appointment.date).toLocaleDateString()}<br />
                <span className="text-xs text-gray-500">{appointment.time}</span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-900">{appointment.reason}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(appointment.status)}`}>{appointment.status}</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                {/* Doctor actions: approve/reject, complete, create bill */}
                {userRole === 'doctor' && appointment.status === 'pending' && (
                  <>
                    <button
                      onClick={async () => { setUpdatingId(appointment._id); await apiService.approveAppointment(appointment._id, true); onUpdate(); setUpdatingId(null); }}
                      disabled={updatingId === appointment._id}
                      className="text-green-600 hover:text-green-900 disabled:opacity-50"
                    >Approve</button>
                    <button
                      onClick={async () => { setUpdatingId(appointment._id); await apiService.approveAppointment(appointment._id, false); onUpdate(); setUpdatingId(null); }}
                      disabled={updatingId === appointment._id}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50"
                    >Reject</button>
                  </>
                )}
                {userRole === 'doctor' && (appointment.status === 'approved' || appointment.status === 'scheduled') && (
                  <>
                    <button
                      onClick={() => handleStatusUpdate(appointment._id, 'completed')}
                      disabled={updatingId === appointment._id}
                      className="text-green-600 hover:text-green-900 disabled:opacity-50"
                    >Complete</button>
                    <button
                      onClick={() => { setSelectedAppointment(appointment); setShowCreateBill(true); }}
                      className="text-indigo-600 hover:text-indigo-900"
                    >Create Bill</button>
                  </>
                )}
                {/* Patient actions: cancel only */}
                {userRole === 'patient' && appointment.status === 'scheduled' && (
                  <button
                    onClick={() => handleCancel(appointment._id)}
                    disabled={updatingId === appointment._id}
                    className="text-red-600 hover:text-red-900 disabled:opacity-50"
                  >Cancel</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Create Bill Modal for doctor */}
      {showCreateBill && selectedAppointment && (
        <CreateBill
          appointmentId={selectedAppointment._id}
          patientId={selectedAppointment.patientId?._id}
          onClose={() => { setShowCreateBill(false); setSelectedAppointment(null); }}
          onSuccess={() => { setShowCreateBill(false); setSelectedAppointment(null); onUpdate(); }}
        />
      )}
    </div>
  );
};

export default AppointmentList;