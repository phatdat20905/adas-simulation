// =========================
// User
// =========================
export interface User {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  image: string;
  active: boolean;
  refreshToken: string | null;
  role: 'user' | 'admin';
  createdAt: string;
  updatedAt: string;
}

// =========================
// Vehicle
// =========================
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

// =========================
// Simulation
// =========================
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
  videoUrl?: string; // ✅ kết quả xử lý video
  createdAt: string;
  updatedAt: string;
}

// =========================
// SensorData
// =========================
export interface SensorData {
  _id: string;
  vehicleId: string;
  simulationId: string;
  userId: string;
  timestamp: string;
  speed?: number | null;
  distance_to_object?: number | null;
  lane_status: 'within' | 'departing' | 'crossed' | 'lost';
  obstacle_detected: boolean;
  camera_frame_url?: string | null;
  ttc?: number | null;
  trackId?: number | null;
  createdAt: string;
  updatedAt: string;
}


// =========================
// Alert
// =========================
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

// =========================
// Common API Response
// =========================
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  user?: User;
}

// =========================
// Dashboard (User)
// =========================
export interface UserDashboard {
  myVideos: number; // số lượng video upload
  mySimulations: number; // số lượng simulation hoàn thành
  myAlerts: number; // tổng số cảnh báo
  alertsByType: {
    collision?: number;
    lane_departure?: number;
    obstacle?: number;
    traffic_sign?: number;
    [key: string]: number; // fallback cho loại khác
  };
  trend7days: { _id: string; count: number }[]; // thống kê simulation 7 ngày gần đây
  recentSimulations: Simulation[];
}

// =========================
// Dashboard (Admin)
// =========================
export interface AdminDashboard {
  totalUsers: number;
  totalVehicles: number;
  totalVideos: number;
  totalSimulations: number;
  statusDistribution: { status: Simulation["status"]; count: number }[];
  alertsByType: {
    collision?: number;
    lane_departure?: number;
    obstacle?: number;
    traffic_sign?: number;
    [key: string]: number;
  };
  topUsers: {
    userId: string;
    fullName: string;
    simulations: number;
  }[];
  trend30days: { _id: string; count: number }[];
  recentSimulations: Simulation[];
}


// =========================
// Support
// =========================
export interface Support {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "pending" | "resolved";
  createdAt: string;
  updatedAt: string;
}



// Phân trang
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}
