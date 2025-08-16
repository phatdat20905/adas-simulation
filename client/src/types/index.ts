export interface User {
  _id: string;
  username: string;
  email: string;
  phone: string;
  role: 'user' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface Vehicle {
  _id: string;
  licensePlate: string;
  brand: 'Honda' | 'Yamaha' | 'Piaggio' | 'Suzuki' | 'SYM' | 'Other';
  model: string;
  color: 'black' | 'white' | 'red' | 'blue' | 'silver' | 'other';
  engineType: 'petrol' | 'electric';
  engineCapacity?: number;
  status: 'active' | 'inactive';
  owner: string;
  createdAt: string;
  updatedAt: string;
}

export interface Simulation {
  _id: string;
  filename: string;
  filepath: string;
  fileType: 'image' | 'video';
  result: {
    totalAlerts: number;
    collisionCount: number;
    laneDepartureCount: number;
    obstacleCount: number;
    trafficSignCount: number;
  };
  vehicleId: string;
  userId: string;
  status: 'pending' | 'completed' | 'failed';
  sensorDataCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SensorData {
  _id: string;
  vehicleId: string;
  simulationId: string;
  userId: string;
  timestamp: string;
  speed: number;
  distance_to_object?: number;
  lane_status: 'within' | 'departing' | 'crossed';
  obstacle_detected: boolean;
  camera_frame_url?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Alert {
  _id: string;
  type: 'collision' | 'lane_departure' | 'obstacle' | 'traffic_sign';
  description: string;
  severity: 'low' | 'medium' | 'high';
  simulationId: string;
  sensorDataId?: string;
  vehicleId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  data: T;
  totalPages?: number;
}