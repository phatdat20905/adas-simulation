export interface User {
  _id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
}

export interface Vehicle {
  _id: string;
  licensePlate: string;
  brand: string;
  model: string;
  year: number;
  userId: string;
}

export interface Simulation {
  _id: string;
  filename: string;
  status: 'pending' | 'completed' | 'failed';
  userId: string;
  vehicleId: string;
}

export interface SensorData {
  _id: string;
  simulationId: string;
  timestamp: string;
  speed: number;
  distance_to_object?: number;
  lane_status: string;
  obstacle_detected: boolean;
  alertLevel: string;
  camera_frame_url?: string;
}

export interface Alert {
  _id: string;
  simulationId: string;
  description: string;
  severity: 'high' | 'low';
  timestamp: string;
}

export interface ApiResponse<T> {
  data: T;
  totalPages?: number;
}