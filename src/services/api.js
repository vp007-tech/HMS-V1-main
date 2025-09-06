const API_BASE_URL = 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getAuthHeaders(),
      ...options
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  // Auth methods
  async login(credentials) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  }

  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  // Patient methods
  async getPatients() {
    return this.request('/patients');
  }

  async getPatient(id) {
    return this.request(`/patients/${id}`);
  }

  async updatePatient(id, data) {
    return this.request(`/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async searchPatients(query) {
    return this.request(`/patients/search/${query}`);
  }

  // Doctor methods
  async getDoctors() {
    return this.request('/doctors');
  }

  async getDoctor(id) {
    return this.request(`/doctors/${id}`);
  }

  async updateDoctor(id, data) {
    return this.request(`/doctors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async searchDoctorsBySpecialization(specialization) {
    return this.request(`/doctors/search/specialization/${specialization}`);
  }

  // Appointment methods
  async getAppointments() {
    return this.request('/appointments');
  }

  async createAppointment(data) {
    return this.request('/appointments', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateAppointment(id, data) {
    return this.request(`/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async cancelAppointment(id) {
    return this.request(`/appointments/${id}`, {
      method: 'DELETE'
    });
  }

  async approveAppointment(id, approve = true) {
    return this.request(`/appointments/${id}/approve`, {
      method: 'PUT',
      body: JSON.stringify({ approve })
    });
  }

  async completeAppointment(id) {
    return this.request(`/appointments/${id}/complete`, {
      method: 'PUT'
    });
  }

  // Billing methods
  async getBills() {
    return this.request('/billing');
  }

  async getBill(id) {
    return this.request(`/billing/${id}`);
  }

  async createBill(data) {
    return this.request('/billing', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateBillPayment(id, data) {
    return this.request(`/billing/${id}/payment`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async uploadPaymentProof(id, file) {
    const formData = new FormData();
    formData.append('paymentProof', file);
    const token = localStorage.getItem('token');
    const response = await fetch(`${this.baseURL}/billing/${id}/payment-proof`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` })
      },
      body: formData
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to upload payment proof');
    }
    return data;
  }

  async verifyPayment(id) {
    return this.request(`/billing/${id}/verify-payment`, {
      method: 'PUT'
    });
  }

  // Chatbot methods
  async getChatHistory() {
    return this.request('/chatbot/history');
  }

  async sendChatMessage(question) {
    return this.request('/chatbot', {
      method: 'POST',
      body: JSON.stringify({ question })
    });
  }

  async clearChatHistory() {
    return this.request('/chatbot/history', {
      method: 'DELETE'
    });
  }
}

export default new ApiService();