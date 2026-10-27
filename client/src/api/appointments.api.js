import api from './axios';

export const bookAppointment = (data) => api.post('/appointments', data);

export const getMyAppointments = (date) =>
  api.get('/appointments', { params: date ? { date } : undefined });
