// server/src/models/Alert.js (nếu cần cập nhật, giữ như trước)
import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['collision', 'lane_departure', 'obstacle', 'traffic_sign'],
      required: [true, 'Loại cảnh báo là bắt buộc'],
    },
    description: {
      type: String,
      required: [true, 'Mô tả là bắt buộc'],
      trim: true,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      required: [true, 'Mức độ nghiêm trọng là bắt buộc'],
    },
    simulationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Simulation',
      required: true,
      index: true,
    },
    sensorDataId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SensorData',
      required: false,
      validate: {
        validator: async function (id) {
          return !id || (await mongoose.model('SensorData').exists({ _id: id }));
        },
        message: 'SensorData không hợp lệ',
      },
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
  },
  { timestamps: true }
);

export default mongoose.model('Alert', alertSchema);
