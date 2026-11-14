import client from './client';

const unwrap = (promise) => promise.then((res) => res.data);

export const authApi = {
  register: (payload) => unwrap(client.post('/auth/register', payload)),
  login: (payload) => unwrap(client.post('/auth/login', payload)),
  logout: () => unwrap(client.post('/auth/logout')),
  me: () => unwrap(client.get('/auth/me')),
};

export const readingsApi = {
  list: (params) => unwrap(client.get('/readings', { params })),
  interpret: (payload) => unwrap(client.post('/readings/interpretation', payload)),
  create: (payload) => unwrap(client.post('/readings', payload)),
  update: (id, payload) => unwrap(client.put(`/readings/${id}`, payload)),
  remove: (id) => unwrap(client.delete(`/readings/${id}`)),
};

export const reportsApi = {
  daily: (date) => unwrap(client.get('/reports/daily', { params: { date } })),
  monthToDate: (date) => unwrap(client.get('/reports/month-to-date', { params: { date } })),
  monthly: (date) => unwrap(client.get('/reports/monthly', { params: { date } })),
};

export const dashboardApi = {
  summary: (date, month) => unwrap(client.get('/dashboard/summary', { params: { date, month } })),
  trends: (month) => unwrap(client.get('/dashboard/trends', { params: { month } })),
};

export const doctorApi = {
  patients: (params = {}) => unwrap(client.get('/doctor/patients', { params })),
  readings: (id, params = {}) => unwrap(client.get(`/doctor/patients/${id}/readings`, { params })),
  daily: (id, date) => unwrap(client.get(`/doctor/patients/${id}/reports/daily`, { params: { date } })),
  monthToDate: (id, date) => unwrap(client.get(`/doctor/patients/${id}/reports/month-to-date`, { params: { date } })),
  monthly: (id, date) => unwrap(client.get(`/doctor/patients/${id}/reports/monthly`, { params: { date } })),
};

export const adminApi = {
  accounts: () => unwrap(client.get('/admin/accounts')),
  createDoctor: (payload) => unwrap(client.post('/admin/doctors', payload)),
  assign: (doctorId, patientId) => unwrap(client.post('/admin/assignments', { doctorId, patientId })),
  removeAssignment: (id) => unwrap(client.delete(`/admin/assignments/${id}`)),
};

export const notificationsApi = {
  list: () => unwrap(client.get('/notifications')),

  markRead: (id) =>
    unwrap(client.patch(`/notifications/${id}/read`)),

  markAllRead: () =>
    unwrap(client.patch('/notifications/read-all')),
};