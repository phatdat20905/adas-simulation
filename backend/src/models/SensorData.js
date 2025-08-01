import mongoose from 'mongoose';

const sensorDataSchema = new mongoose.Schema({
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true,
    index: true,
  },
  simulationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Simulation',
    required: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  timestamp: {
    type: Date,
    required: true,
    index: true,
  },
  speed: {
    type: Number,
    required: true,
    min: 0,
  },
  distance_to_object: {
    type: Number,
    required: false,
    min: 0,
  },
  lane_status: {
    type: String,
    enum: ['within', 'departing', 'crossed'],
    required: true,
  },
  obstacle_detected: {
    type: Boolean,
    default: false,
  },
  camera_frame_url: {
    type: String,
    trim: true,
    required: false,
  },
  alertLevel: {
    type: String,
    enum: ['none', 'low', 'high'],
    default: 'none',
  },
});

export default mongoose.model('SensorData', sensorDataSchema);