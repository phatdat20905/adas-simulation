import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const register = (data) => api.post('/users/register', data);
export const login = (data) => api.post('/users/login', data);
export const getVehicles = () => api.get('/vehicles');
export const createVehicle = (data) => api.post('/vehicles', data);
export const deleteVehicle = (id) => api.delete(`/vehicles/${id}`);
export const uploadFile = (formData) => api.post('/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
});
export const simulate = (data) => api.post('/simulate', data);
export const getSimulations = () => api.get('/simulate');
export const getSensorData = (simulationId) => api.get(`/sensordata/${simulationId}`);
export const getAlerts = () => api.get('/alerts');
export const getUsers = () => api.get('/users');