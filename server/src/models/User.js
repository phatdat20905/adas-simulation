import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Họ và tên là bắt buộc'],
    unique: true,
    trim: true,
    minlength: [3, 'Họ và tên phải có ít nhất 3 ký tự'],
    maxlength: [30, 'Họ và tên không được vượt quá 30 ký tự'],
  },
  email: {
    type: String,
    required: [true, 'Email là bắt buộc'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email không hợp lệ'],
    index: true,
  },
  phone: {
    type: String,
    required: [true, 'Số điện thoại là bắt buộc'],
    unique: true,
    trim: true,
    match: [/^0\d{9}$/, 'Số điện thoại không hợp lệ (10 chữ số, bắt đầu bằng 0)'],
  },
  password: {
    type: String,
    required: [true, 'Mật khẩu là bắt buộc'],
    minlength: [6, 'Mật khẩu phải có ít nhất 6 ký tự'],
  },
  address: {
    type: String,
    trim: true,
    maxlength: [200, 'Địa chỉ không được vượt quá 200 ký tự']
  },
  image: {
    type: String,
    trim: true,
    default: null
  },
  active: {
    type: Boolean,
    default: true,
    required: true
  },
  refreshToken: {
    type: String,
    default: null,
    index: true,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
    required: true,
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

userSchema.pre('save', async function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('User', userSchema);