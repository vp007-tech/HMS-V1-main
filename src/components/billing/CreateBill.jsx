import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';

const CreateBill = ({ onClose, onSuccess, appointmentId, patientId }) => {
  const [patients, setPatients] = useState([]);
  const [formData, setFormData] = useState({
    patientId: patientId || '',
    appointmentId: appointmentId || '',
    services: [{ description: '', quantity: 1, unitPrice: 0 }],
    tax: 0,
    discount: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!patientId) {
      loadPatients();
    }
  }, []);

  const loadPatients = async () => {
    try {
      const data = await apiService.getPatients();
      setPatients(data);
    } catch (error) {
      console.error('Error loading patients:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleServiceChange = (index, field, value) => {
    const newServices = [...formData.services];
    newServices[index][field] = value;
    setFormData({ ...formData, services: newServices });
  };

  const addService = () => {
    setFormData({
      ...formData,
      services: [...formData.services, { description: '', quantity: 1, unitPrice: 0 }]
    });
  };

  const removeService = (index) => {
    const newServices = formData.services.filter((_, i) => i !== index);
    setFormData({ ...formData, services: newServices });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await apiService.createBill(formData);
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    const subtotal = formData.services.reduce(
      (sum, service) => sum + (service.quantity * service.unitPrice), 0
    );
    return subtotal + formData.tax - formData.discount;
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Create New Bill</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
              {patientId ? (
                <input
                  type="text"
                  value={patients.find(p => p._id === patientId)?.userId?.name || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                />
              ) : (
                <select
                  name="patientId"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  value={formData.patientId}
                  onChange={handleChange}
                >
                  <option value="">Select a patient</option>
                  {patients.map((patient) => (
                    <option key={patient._id} value={patient._id}>
                      {patient.userId?.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Services</label>
              {formData.services.map((service, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Service description"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                    value={service.description}
                    onChange={(e) => handleServiceChange(index, 'description', e.target.value)}
                    required
                  />
                  <input
                    type="number"
                    placeholder="Qty"
                    className="w-20 px-3 py-2 border border-gray-300 rounded-md"
                    value={service.quantity}
                    onChange={(e) => handleServiceChange(index, 'quantity', parseInt(e.target.value))}
                    min="1"
                    required
                  />
                  <input
                    type="number"
                    placeholder="Price"
                    className="w-24 px-3 py-2 border border-gray-300 rounded-md"
                    value={service.unitPrice}
                    onChange={(e) => handleServiceChange(index, 'unitPrice', parseFloat(e.target.value))}
                    min="0"
                    step="0.01"
                    required
                  />
                  {formData.services.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeService(index)}
                      className="px-2 py-2 text-red-600 hover:text-red-800"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addService}
                className="text-primary-600 hover:text-primary-800 text-sm transition-colors"
              >
                + Add Service
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tax ($)</label>
                <input
                  type="number"
                  name="tax"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.tax}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discount ($)</label>
                <input
                  type="number"
                  name="discount"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.discount}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-md">
              <div className="text-lg font-semibold">Total: ${calculateTotal().toFixed(2)}</div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Creating...' : 'Create Bill'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateBill;
