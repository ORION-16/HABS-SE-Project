import api from './axios';

export const setAvailability = (data) => api.post('/availability', data);

export const blockDates = (data) => api.patch('/availability/block', data);

export const unblockDates = (data) => api.delete('/availability/unblock', { data });

export const getAvailability = (doctorId) => api.get(`/availability/${doctorId}`);

export const getOpenSlots = (doctorId, date) =>
  api.get(`/availability/open-slots/${doctorId}?date=${date}`);
