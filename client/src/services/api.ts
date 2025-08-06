import axios from 'axios';
import type { User, Vehicle, Simulation, SensorData, Alert, ApiResponse } from '../types';

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

export const register = (data: { username: string; email: string; password: string }) =>
  api.post<ApiResponse<{ user: User; token: string }>>('/users/register', data);

export const login = (data: { email: string; password: string }) =>
  api.post<ApiResponse<{ user: User; token: string }>>('/users/login', data);

export const getVehicles = () => api.get<ApiResponse<Vehicle[]>>('/vehicles');

export const createVehicle = (data: { licensePlate: string; brand: string; model: string; year: number }) =>
  api.post<ApiResponse<Vehicle>>('/vehicles', data);

export const deleteVehicle = (id: string) => api.delete(`/vehicles/${id}`);

export const uploadFile = (formData: FormData) =>
  api.post<ApiResponse<{ simulationId: string }>>('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const simulate = (data: { simulationId: string }) => api.post('/simulate', data);

export const getSimulations = (page: number = 1, limit: number = 10) =>
  api.get<ApiResponse<{ simulations: Simulation[]; totalPages: number }>>(`/simulate?page=${page}&limit=${limit}`);

export const getSensorData = (simulationId: string, page: number = 1, limit: number = 10) =>
  api.get<ApiResponse<{ sensorData: SensorData[]; totalPages: number }>>(
    `/sensordata/${simulationId}?page=${page}&limit=${limit}`,
  );

export const getAlerts = (page: number = 1, limit: number = 10) =>
  api.get<ApiResponse<{ alerts: Alert[]; totalPages: number }>>(`/alerts?page=${page}&limit=${limit}`);

export const getUsers = () => api.get<ApiResponse<User[]>>('/users');
