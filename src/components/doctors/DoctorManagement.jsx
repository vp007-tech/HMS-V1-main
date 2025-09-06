import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';

const DoctorManagement = () => {
  const [doctors, setDoctors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    try {
      const data = await apiService.getDoctors();
      setDoctors(data);
    } catch (error) {
      console.error('Error loading doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (searchTerm.trim()) {
      try {
        const data = await apiService.searchDoctorsBySpecialization(searchTerm);
        setDoctors(data);
      } catch (error) {
        console.error('Error searching doctors:', error);
      }
    } else {
      loadDoctors();
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading doctors...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search doctors by specialization..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >Search</button>
        <button
          onClick={loadDoctors}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
        >Reset</button>
      </div>

      {/* Doctors Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {doctors.map((doctor) => (
          <div key={doctor._id} className="bg-white shadow rounded-lg p-6 flex flex-col items-center">
            <img
              src={doctor.image || '/cover/default-doctor.jpg'}
              alt={doctor.userId?.name || 'Doctor'}
              className="w-24 h-24 rounded-full object-cover mb-4 border"
              onError={e => { e.target.src = '/cover/default-doctor.jpg'; }}
            />
            <h4 className="text-lg font-semibold text-gray-900 mb-1">{doctor.userId?.name || 'N/A'}</h4>
            <div className="text-sm text-gray-600 mb-2">{doctor.specialization} | {doctor.department}</div>
            <div className="text-xs text-gray-500 mb-2">Experience: {doctor.experience} years</div>
            <div className="text-xs text-gray-500 mb-2">Consultation Fee: ${doctor.consultationFee}</div>
            {doctor.qualifications && doctor.qualifications.length > 0 && (
              <div className="mb-2 text-xs text-gray-700">
                <span className="font-semibold">Qualifications:</span> {doctor.qualifications.join(', ')}
              </div>
            )}
            {doctor.bio && (
              <div className="mb-2 text-xs text-gray-700">
                <span className="font-semibold">Bio:</span> {doctor.bio}
              </div>
            )}
            <div className="mb-2 text-xs text-gray-700">
              <span className="font-semibold">Contact:</span> {doctor.contact?.email || doctor.userId?.email || 'N/A'} | {doctor.contact?.phone || doctor.userId?.contactNumber || 'N/A'}
            </div>
          </div>
        ))}
        {doctors.length === 0 && (
          <div className="text-center py-8 text-gray-500 col-span-3">No doctors found</div>
        )}
      </div>
    </div>
  );
};

export default DoctorManagement;