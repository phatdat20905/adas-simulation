import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['collision', 'lane_departure', 'obstacle', 'traffic_sign'],
    required: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high'],
    required: true,
  },
  simulationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Simulation',
    required: true,
  },
  sensorDataId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SensorData',
    required: false,
  },
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

export default mongoose.model('Alert', alertSchema);