import axios from 'axios';
import type {
  User,
  Vehicle,
  Simulation,
  SensorData,
  Alert,
  ApiResponse,
  PaginatedResponse,
  UserDashboard,
  AdminDashboard,
  Support,
} from '../types';

// =========================
// Axios instance
// =========================
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// =========================
// Request interceptor
// =========================
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// =========================
// Response interceptor (refresh token)
// =========================
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      try {
        const refreshResponse = await refreshToken();
        const newToken = refreshResponse.data.accessToken || refreshResponse.data.token;
        if (newToken) {
          localStorage.setItem('token', newToken);
          error.config.headers.Authorization = `Bearer ${newToken}`;
          return api(error.config);
        }
      } catch (refreshError) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('refreshToken');
        window.location.href = '/signin';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
);

// =========================
// User APIs
// =========================
export const register = (data: {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role?: 'user' | 'admin';
  address?: string;
  image?: string;
}) =>
  api.post<ApiResponse<{ user: User; token: string; refreshToken: string }>>('/users/register', data);

export const login = (data: { email: string; password: string }) =>
  api.post<ApiResponse<{ user: User; token: string; refreshToken: string }>>('/users/login', data);

export const refreshToken = (refreshToken?: string) =>
  api.post<ApiResponse<{ token: string }>>('/users/refresh', {
    refreshToken: refreshToken || localStorage.getItem('refreshToken'),
  });

export const getCurrentUser = () => api.get<ApiResponse<User>>('/users/me');
export const updateUser = (data: Partial<User>) => api.put<ApiResponse<User>>('/users/me', data);
export const deleteUser = () => api.delete<ApiResponse<void>>('/users/me');
export const logout = () => api.post<ApiResponse<void>>('/users/logout');

// Admin user APIs
export const getUsersAdmin = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  role?: 'user' | 'admin' | '';
  active?: '' | 'true' | 'false';
  sort?: string;
}) =>
  api.get<ApiResponse<PaginatedResponse<User>>>('/users', { params });

export const updateUserById = (id: string, data: Partial<User>) =>
  api.put<ApiResponse<User>>(`/users/${id}`, data);

export const deleteUserById = (id: string) =>
  api.delete<ApiResponse<{ message: string }>>(`/users/${id}`);

// =========================
// Vehicle APIs
// =========================
export const createVehicle = (
  data: Omit<Vehicle, '_id' | 'status' | 'owner' | 'createdAt' | 'updatedAt'>,
) => api.post<ApiResponse<Vehicle>>('/vehicles', data);

export const getVehicles = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  brand?: string;
  status?: string;
}) => api.get<ApiResponse<PaginatedResponse<Vehicle>>>('/vehicles', { params });

export const getVehicleById = (id: string) => api.get<ApiResponse<Vehicle>>(`/vehicles/${id}`);
export const updateVehicle = (id: string, data: Partial<Vehicle>) =>
  api.put<ApiResponse<Vehicle>>(`/vehicles/${id}`, data);
export const deleteVehicle = (id: string) =>
  api.delete<ApiResponse<{ message: string }>>(`/vehicles/${id}`);

// Lấy tất cả xe của user (bao gồm inactive)
export const getUserVehicles = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  brand?: string;
  status?: string;
  engineType?: string;
  sort?: string;
}) => api.get<ApiResponse<PaginatedResponse<Vehicle>>>('/vehicles/me', { params });


// =========================
// Simulation APIs
// =========================
export const createSimulation = (data: {
  filename: string;
  filepath: string;
  fileType: 'image' | 'video';
  vehicleId: string;
}) => api.post<ApiResponse<Simulation>>('/simulates', data);

export const getSimulations = (page: number = 1, limit: number = 10) =>
  api.get<ApiResponse<PaginatedResponse<Simulation>>>(`/simulates?page=${page}&limit=${limit}`);

export const getSimulationById = (id: string) =>
  api.get<ApiResponse<Simulation>>(`/simulates/${id}`);

export const updateSimulation = (id: string, data: Partial<Simulation>) =>
  api.put<ApiResponse<Simulation>>(`/simulates/${id}`, data);

export const deleteSimulation = (id: string) =>
  api.delete<ApiResponse<{ message: string }>>(`/simulates/${id}`);

export const simulateADAS = (data: { simulationId: string }) =>
  api.post<ApiResponse<Simulation>>('/simulates/simulate', data);

export const getSimulationVideoUrl = (id: string) =>
  `http://localhost:5000/api/simulates/${id}/video`;

// =========================
// SensorData APIs
// =========================
export const createSensorData = (
  data: Omit<SensorData, '_id' | 'createdAt' | 'updatedAt'>
) => api.post<ApiResponse<SensorData>>('/sensordata', data);

export const getSensorData = (page = 1, limit = 10) =>
  api.get<ApiResponse<PaginatedResponse<SensorData>>>(
    `/sensordata?page=${page}&limit=${limit}`
  );

export const getSensorDataBySimulation = (
  simulationId: string,
  page = 1,
  limit = 10
) =>
  api.get<ApiResponse<PaginatedResponse<SensorData>>>(
    `/sensordata/simulation/${simulationId}?page=${page}&limit=${limit}`
  );

export const updateSensorData = (id: string, data: Partial<SensorData>) =>
  api.put<ApiResponse<SensorData>>(`/sensordata/${id}`, data);

export const deleteSensorData = (id: string) =>
  api.delete<ApiResponse<void>>(`/sensordata/${id}`);

// =========================
// Alert APIs
// =========================
export const createAlert = (data: Omit<Alert, '_id' | 'createdAt' | 'updatedAt' | 'userId'>) =>
  api.post<ApiResponse<Alert>>('/alerts', data);

export const getAlerts = (page = 1, limit = 10) =>
  api.get<ApiResponse<PaginatedResponse<Alert>>>(`/alerts?page=${page}&limit=${limit}`);

export const updateAlert = (id: string, data: Partial<Alert>) =>
  api.put<ApiResponse<Alert>>(`/alerts/${id}`, data);

export const deleteAlert = (id: string) => api.delete<ApiResponse<void>>(`/alerts/${id}`);

// =========================
// Upload APIs
// =========================
export const uploadFile = (formData: FormData) =>
  api.post<ApiResponse<{ simulation: Simulation }>>('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });


// =========================
// Dashboard APIs
// =========================

// Lấy dữ liệu dashboard cho User
export const getUserDashboard = () =>
  api.get<ApiResponse<UserDashboard>>("/dashboard/user");

// Lấy dữ liệu dashboard cho Admin
export const getAdminDashboard = () =>
  api.get<ApiResponse<AdminDashboard>>("/dashboard/admin");

// =========================
// Support APIs
// =========================

// Người dùng gửi form liên hệ (không cần login)
export const createSupport = (data: {
  name: string;
  email: string;
  message: string;
}) => api.post<ApiResponse<Support>>("/support/contact", data);

// Admin lấy danh sách yêu cầu hỗ trợ
export const getSupports = (params?: { page?: number; limit?: number }) =>
  api.get<ApiResponse<PaginatedResponse<Support>>>("/support", { params });

export const updateSupport = (id: string, data: Partial<Support>) =>
  api.put<ApiResponse<Support>>(`/supports/${id}`, data);

export const deleteSupport = (id: string) =>
  api.delete<ApiResponse<void>>(`/supports/${id}`);



export default api;
