import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Players
export const playersApi = {
  getAll: (params) => api.get('/players', { params }),
  getById: (id) => api.get(`/players/${id}`),
  create: (data) => api.post('/players', data),
  update: (id, data) => api.put(`/players/${id}`, data),
  delete: (id) => api.delete(`/players/${id}`),
  getDebts: (id) => api.get(`/players/${id}/debts`),
};

// Ratios
export const ratiosApi = {
  getAll: () => api.get('/ratios'),
  getById: (id) => api.get(`/ratios/${id}`),
  create: (data) => api.post('/ratios', data),
  update: (id, data) => api.put(`/ratios/${id}`, data),
  delete: (id) => api.delete(`/ratios/${id}`),
  getDefaults: (gender) => api.get('/ratios/defaults', { params: { gender } }),
};

// Menus
export const menusApi = {
  getAll: () => api.get('/menus'),
  getById: (id) => api.get(`/menus/${id}`),
  create: (data) => api.post('/menus', data),
  update: (id, data) => api.put(`/menus/${id}`, data),
  delete: (id) => api.delete(`/menus/${id}`),
};

// Shuttles
export const shuttlesApi = {
  getAll: () => api.get('/shuttles'),
  getById: (id) => api.get(`/shuttles/${id}`),
  create: (data) => api.post('/shuttles', data),
  update: (id, data) => api.put(`/shuttles/${id}`, data),
  delete: (id) => api.delete(`/shuttles/${id}`),
};

// Bills
export const billsApi = {
  getAll: (params) => api.get('/bills', { params }),
  getById: (id) => api.get(`/bills/${id}`),
  create: (data) => api.post('/bills', data),
  update: (id, data) => api.put(`/bills/${id}`, data),
  delete: (id) => api.delete(`/bills/${id}`),
  markPayment: (billId, playerId, data) => api.post(`/bills/${billId}/players/${playerId}/pay`, data),
  getSubBills: (billId) => api.get(`/bills/${billId}/sub-bills`),
  createSubBill: (billId, data) => api.post(`/bills/${billId}/sub-bills`, data),
};

// Debts
export const debtsApi = {
  getAll: () => api.get('/debts'),
  getById: (id) => api.get(`/debts/${id}`),
  create: (data) => api.post('/debts', data),
  update: (id, data) => api.put(`/debts/${id}`, data),
  delete: (id) => api.delete(`/debts/${id}`),
};

// Payment Accounts
export const paymentAccountsApi = {
  getAll: (params) => api.get('/payment-accounts', { params }),
  getById: (id) => api.get(`/payment-accounts/${id}`),
  create: (data) => api.post('/payment-accounts', data),
  update: (id, data) => api.put(`/payment-accounts/${id}`, data),
  delete: (id) => api.delete(`/payment-accounts/${id}`),
};

export default api;

