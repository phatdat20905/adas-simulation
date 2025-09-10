import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema({
  licensePlate: {
    type: String,
    required: [true, 'Biển số là bắt buộc'],
    unique: true,
    trim: true,
    match: [/^[0-9A-Z.-]{5,15}$/, 'Biển số không đúng định dạng'],
  },
  brand: {
    type: String,
    required: [true, 'Hãng xe là bắt buộc'],
    trim: true,
    enum: ['Honda', 'Yamaha', 'Piaggio', 'Suzuki', 'SYM', 'Other'],
  },
  model: {
    type: String,
    required: [true, 'Model xe là bắt buộc'],
    trim: true,
  },
  color: {
    type: String,
    required: [true, 'Màu xe là bắt buộc'],
    trim: true,
    enum: ['black', 'white', 'red', 'blue', 'silver', 'other'],
  },
  engineType: {
    type: String,
    enum: ['petrol', 'electric'],
    default: 'petrol',
  },
  engineCapacity: {
    type: Number,
    min: [50, 'Dung tích xi-lanh phải từ 50cc trở lên'],
    max: [500, 'Dung tích xi-lanh tối đa 500cc'],
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
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

vehicleSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  // normalize dữ liệu
  if (this.brand) this.brand = this.brand.charAt(0).toUpperCase() + this.brand.slice(1);
  if (this.color) this.color = this.color.toLowerCase();
  next();
});

export default mongoose.model('Vehicle', vehicleSchema);
