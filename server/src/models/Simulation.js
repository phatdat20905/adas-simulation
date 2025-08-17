import mongoose from 'mongoose';

const simulationSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: [true, 'Tên file là bắt buộc'],
    trim: true,
  },
  filepath: {
    type: String,
    required: [true, 'Đường dẫn file là bắt buộc'],
    trim: true,
    // match: [/^https?:\/\/[^\s$.?#].[^\s]*$/, 'Đường dẫn file không hợp lệ'],
  },
  fileType: {
    type: String,
    enum: ['image', 'video'],
    required: [true, 'Loại file là bắt buộc'],
  },
  result: {
    type: {
      totalAlerts: { type: Number, default: 0 },
      collisionCount: { type: Number, default: 0 },
      laneDepartureCount: { type: Number, default: 0 },
      obstacleCount: { type: Number, default: 0 },
      trafficSignCount: { type: Number, default: 0 },
    },
    default: {},
  },
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending',
  },
  sensorDataCount: {
    type: Number,
    default: 0,
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

simulationSchema.pre('save', async function (next) {
  this.updatedAt = Date.now();
  if (this.isNew || this.isModified('sensorDataCount')) {
    this.sensorDataCount = await mongoose.model('SensorData').countDocuments({ simulationId: this._id });
  }
  next();
});

export default mongoose.model('Simulation', simulationSchema);