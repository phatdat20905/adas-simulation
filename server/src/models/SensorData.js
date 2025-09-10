// server/src/models/SensorData.js
import mongoose from 'mongoose';

const sensorDataSchema = new mongoose.Schema(
  {
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
    // relative speed (can be negative): remove min constraint
    speed: {
      type: Number,
      required: [false, 'Tốc độ là bắt buộc'],
      default: null,
    },
    distance_to_object: {
      type: Number,
      min: [0, 'Khoảng cách không được âm'],
      default: null,
    },
    lane_status: {
      type: String,
      enum: ['within', 'departing', 'crossed', 'lost'],
      required: [true, 'Trạng thái làn đường là bắt buộc'],
      default: 'within',
    },
    obstacle_detected: {
      type: Boolean,
      default: false,
    },
    camera_frame_url: {
      type: String,
      trim: true,
      default: null,
    },
    ttc: {
      type: Number,
      default: null,
    },
    trackId: {
      type: Number,
      default: null,
      index: true
    }
  },
  { timestamps: true }
);

export default mongoose.model('SensorData', sensorDataSchema);
