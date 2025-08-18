import axios from 'axios';
import type { User, Vehicle, Simulation, SensorData, Alert } from '../types';

// Định nghĩa interface cho response của backend
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  user?: T;
  accessToken?: string;
  refreshToken?: string;
}

const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Proxy tới http://localhost:5000
});

// Interceptor để thêm token vào header
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  console.log('Request URL:', config.url, 'Token:', token); // Debug
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor để xử lý lỗi 401 và làm mới token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      console.log('Attempting to refresh token'); // Debug
      try {
        const refreshResponse = await refreshToken();
        console.log('Refresh token response:', refreshResponse.data); // Debug
        const newToken = refreshResponse.data.accessToken || refreshResponse.data.token;
        localStorage.setItem('token', newToken);
        error.config.headers.Authorization = `Bearer ${newToken}`;
        return api(error.config);
      } catch (refreshError) {
        console.error('Refresh token failed:', refreshError); // Debug
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
);

// User APIs
export const register = (data: { username: string; email: string; phone: string; password: string; role?: 'user' | 'admin' }) =>
  api.post<ApiResponse<{ user: User; token: string; refreshToken: string }>>('/users/register', data);

export const login = (data: { email: string; password: string }) =>
  api.post<ApiResponse<{ user: User; token: string; refreshToken: string }>>('/users/login', data);

export const refreshToken = (refreshToken?: string) =>
  api.post<ApiResponse<{ token: string }>>('/users/refresh', { refreshToken: refreshToken || localStorage.getItem('refreshToken') });

export const getCurrentUser = () => api.get<ApiResponse<User>>('/users/me');

export const updateUser = (data: { username?: string; email?: string; phone?: string; password?: string }) =>
  api.put<ApiResponse<User>>('/users/me', data);

export const deleteUser = () => api.delete<ApiResponse<void>>('/users/me');

export const logout = () => api.post<ApiResponse<void>>('/users/logout');

export const getUsers = () => api.get<ApiResponse<User[]>>('/users');

// Vehicle APIs
export const createVehicle = (data: { licensePlate: string; brand: string; model: string; color: string; engineType?: string; engineCapacity?: number }) =>
  api.post<ApiResponse<Vehicle>>('/vehicles', data);

export const getVehicles = (page: number = 1) => api.get<ApiResponse<Vehicle[]>>(`/vehicles?page=${page}&limit=10`);

export const getVehicleById = (id: string) => api.get<ApiResponse<Vehicle>>(`/vehicles/${id}`);

export const updateVehicle = (id: string, data: { licensePlate?: string; brand?: string; model?: string; color?: string; engineType?: string; engineCapacity?: number }) =>
  api.put<ApiResponse<Vehicle>>(`/vehicles/${id}`, data);

export const deleteVehicle = (id: string) => api.delete<ApiResponse<void>>(`/vehicles/${id}`);

// Simulation APIs
export const createSimulation = (data: { filename: string; filepath: string; fileType: 'image' | 'video'; vehicleId: string }) =>
  api.post<ApiResponse<Simulation>>('/simulates', data);

export const getSimulations = (page: number = 1, limit: number = 10) =>
  api.get<ApiResponse<{ simulations: Simulation[]; totalPages: number }>>(`/simulates?page=${page}&limit=${limit}`);

export const getSimulationById = (id: string) => api.get<ApiResponse<Simulation>>(`/simulates/${id}`);

export const updateSimulation = (id: string, data: { filename?: string; filepath?: string; fileType?: 'image' | 'video'; status?: 'pending' | 'completed' | 'failed'; result?: Simulation['result'] }) =>
  api.put<ApiResponse<Simulation>>(`/simulates/${id}`, data);

export const deleteSimulation = (id: string) => api.delete<ApiResponse<void>>(`/simulates/${id}`);

export const simulateADAS = (data: { simulationId: string }) => api.post<ApiResponse<Simulation>>('/simulates/simulate', data);

// SensorData APIs
export const createSensorData = (data: { vehicleId: string; simulationId: string; timestamp: string; speed: number; distance_to_object?: number; lane_status: 'within' | 'departing' | 'crossed'; obstacle_detected: boolean; camera_frame_url?: string }) =>
  api.post<ApiResponse<SensorData>>('/sensordata', data);

export const getSensorData = (page: number = 1, limit: number = 10) =>
  api.get<ApiResponse<{ sensorData: SensorData[]; totalPages: number }>>(`/sensordata?page=${page}&limit=${limit}`);

export const getSensorDataBySimulation = (simulationId: string, page: number = 1, limit: number = 10) =>
  api.get<ApiResponse<{ sensorData: SensorData[]; totalPages: number }>>(`/sensordata/simulation/${simulationId}?page=${page}&limit=${limit}`);

export const updateSensorData = (id: string, data: { speed?: number; distance_to_object?: number; lane_status?: 'within' | 'departing' | 'crossed'; obstacle_detected?: boolean; camera_frame_url?: string }) =>
  api.put<ApiResponse<SensorData>>(`/sensordata/${id}`, data);

export const deleteSensorData = (id: string) => api.delete<ApiResponse<void>>(`/sensordata/${id}`);

// Alert APIs
export const createAlert = (data: { type: 'collision' | 'lane_departure' | 'obstacle' | 'traffic_sign'; description: string; severity: 'low' | 'medium' | 'high'; simulationId: string; vehicleId: string; sensorDataId?: string }) =>
  api.post<ApiResponse<Alert>>('/alerts', data);

export const getAlerts = (page: number = 1, limit: number = 10) =>
  api.get<ApiResponse<{ alerts: Alert[]; totalPages: number }>>(`/alerts?page=${page}&limit=${limit}`);

export const updateAlert = (id: string, data: { type?: 'collision' | 'lane_departure' | 'obstacle' | 'traffic_sign'; description?: string; severity?: 'low' | 'medium' | 'high' }) =>
  api.put<ApiResponse<Alert>>(`/alerts/${id}`, data);

export const deleteAlert = (id: string) => api.delete<ApiResponse<void>>(`/alerts/${id}`);

// Upload API
export const uploadFile = (formData: FormData) =>
  api.post<ApiResponse<{ simulation: Simulation }>>('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export default api;