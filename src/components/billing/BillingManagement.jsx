import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';
import CreateBill from './CreateBill';

const BillingManagement = ({ userRole: userRoleProp }) => {
  const [bills, setBills] = useState([]);
  const [showCreateBill, setShowCreateBill] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(userRoleProp || '');
  const [uploadingId, setUploadingId] = useState(null);
  const [verifyingId, setVerifyingId] = useState(null);

  useEffect(() => {
    if (!userRoleProp) {
      const token = localStorage.getItem('token');
      if (token) {
        apiService.getCurrentUser().then(user => setUserRole(user.role)).catch(() => {});
      }
    } else {
      setUserRole(userRoleProp);
    }
  }, []);

  useEffect(() => {
    loadBills();
  }, []);

  const loadBills = async () => {
    try {
      const data = await apiService.getBills();
      setBills(data);
    } catch (error) {
      console.error('Error loading bills:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentUpdate = async (billId, status, paymentMethod) => {
    try {
      await apiService.updateBillPayment(billId, { status, paymentMethod });
      loadBills();
    } catch (error) {
      console.error('Error updating payment:', error);
    }
  };

  const handleUploadProof = async (billId, file) => {
    setUploadingId(billId);
    try {
      await apiService.uploadPaymentProof(billId, file);
      loadBills();
    } catch (error) {
      alert(error.message);
    } finally {
      setUploadingId(null);
    }
  };

  const handleVerifyPayment = async (billId) => {
    setVerifyingId(billId);
    try {
      await apiService.verifyPayment(billId);
      loadBills();
    } catch (error) {
      alert(error.message);
    } finally {
      setVerifyingId(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading bills...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Billing Management</h3>
        <button
          onClick={() => setShowCreateBill(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          💰 Create New Bill
        </button>
      </div>

      {/* Bills Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Proof</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Verified</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {bills.map((bill) => (
              <tr key={bill._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{bill.invoiceNumber}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{bill.patientId?.userId?.name || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${bill.totalAmount}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(bill.status)}`}>{bill.status}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(bill.dueDate).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {bill.paymentProof ? (
                    <a href={bill.paymentProof} target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">View PDF</a>
                  ) : (
                    userRole === 'patient' && bill.status === 'pending' && (
                      <form onSubmit={e => { e.preventDefault(); handleUploadProof(bill._id, e.target.paymentProof.files[0]); }}>
                        <input type="file" name="paymentProof" accept="application/pdf" required className="mb-2" />
                        <button type="submit" disabled={uploadingId === bill._id} className="text-indigo-600 hover:text-indigo-900 disabled:opacity-50">Upload</button>
                      </form>
                    )
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {bill.verifiedByDoctor ? (
                    <span className="text-green-600 font-semibold">Verified</span>
                  ) : (
                    userRole === 'doctor' && bill.paymentProof && (
                      <button onClick={() => handleVerifyPayment(bill._id)} disabled={verifyingId === bill._id} className="text-indigo-600 hover:text-indigo-900 disabled:opacity-50">Verify</button>
                    )
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  {bill.status === 'pending' && userRole === 'admin' && (
                    <>
                      <button onClick={() => handlePaymentUpdate(bill._id, 'paid', 'cash')} className="text-green-600 hover:text-green-900">Mark Paid</button>
                      <button onClick={() => handlePaymentUpdate(bill._id, 'overdue', null)} className="text-red-600 hover:text-red-900">Mark Overdue</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {bills.length === 0 && (
          <div className="text-center py-8 text-gray-500">No bills found</div>
        )}
      </div>

      {/* Create Bill Modal */}
      {showCreateBill && (
        <CreateBill
          onClose={() => setShowCreateBill(false)}
          onSuccess={() => {
            setShowCreateBill(false);
            loadBills();
          }}
        />
      )}
    </div>
  );
};

export default BillingManagement;