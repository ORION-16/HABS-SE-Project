import api from './axios';

export const registerUser = (data) => api.post('/auth/register', data);

export const loginUser = (data) => api.post('/auth/login', data);

export const logoutUser = () => api.post('/auth/logout');

export const verifyEmail = (token) => api.get(`/auth/verify-email?token=${token}`);

export const forgotPassword = (data) => api.post('/auth/forgot-password', data);

export const resetPassword = (data) => api.post('/auth/reset-password', data);

export const getMe = () => api.get('/auth/me');
