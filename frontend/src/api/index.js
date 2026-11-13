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
