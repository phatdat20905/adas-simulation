import mongoose from 'mongoose';

const simulationSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true,
    trim: true,
  },
  filepath: {
    type: String,
    required: true,
    trim: true,
  },
  fileType: {
    type: String,
    enum: ['image', 'video'],
    required: true,
  },
  result: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
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

simulationSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Simulation', simulationSchema);