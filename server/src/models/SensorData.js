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
    required: [true, 'Tốc độ là bắt buộc'],
    min: [0, 'Tốc độ không được âm'],
  },
  distance_to_object: {
    type: Number,
    required: false,
    min: [0, 'Khoảng cách không được âm'],
  },
  lane_status: {
    type: String,
    enum: ['within', 'departing', 'crossed'],
    required: [true, 'Trạng thái làn đường là bắt buộc'],
  },
  obstacle_detected: {
    type: Boolean,
    default: false,
  },
  camera_frame_url: {
    type: String,
    trim: true,
    required: false,
    match: [/^https?:\/\/[^\s$.?#].[^\s]*$/, 'URL không hợp lệ'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

sensorDataSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('SensorData', sensorDataSchema);