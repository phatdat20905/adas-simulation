import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from '../services/api';
import toast from 'react-hot-toast';

function Register() {
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const validateEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePhone = (phone: string): boolean => /^0\d{9}$/.test(phone);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username.length < 3 || username.length > 30) {
      toast.error('Tên người dùng phải từ 3 đến 30 ký tự');
      return;
    }
    if (!validateEmail(email)) {
      toast.error('Email không hợp lệ');
      return;
    }
    if (!validatePhone(phone)) {
      toast.error('Số điện thoại không hợp lệ (10 chữ số, bắt đầu bằng 0)');
      return;
    }
    if (password.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    setIsLoading(true);
    try {
      const response = await register({ username, email, phone, password });
      if (response.data.success) {
        localStorage.setItem('user', JSON.stringify(response.data.data?.user));
        localStorage.setItem('token', response.data.token!);
        localStorage.setItem('refreshToken', response.data.refreshToken!);
        toast.success('Đăng ký thành công!');
        setTimeout(() => navigate('/dashboard'), 1000);
      } else {
        toast.error(response.data.message);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Đăng ký thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded shadow max-w-md w-full">
        <img src="/logo.png" alt="Logo" className="w-24 h-24 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-4 text-center">Đăng ký</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-1">Tên người dùng</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="border rounded p-2 w-full"
              required
              disabled={isLoading}
            />
          </div>
          <div className="mb-4">
            <label className="block mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border rounded p-2 w-full"
              required
              disabled={isLoading}
            />
          </div>
          <div className="mb-4">
            <label className="block mb-1">Số điện thoại</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="border rounded p-2 w-full"
              required
              disabled={isLoading}
            />
          </div>
          <div className="mb-4">
            <label className="block mb-1">Mật khẩu</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border rounded p-2 w-full"
              required
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            className="bg-blue-500 text-white p-2 rounded w-full hover:bg-blue-600 disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? 'Đang đăng ký...' : 'Đăng ký'}
          </button>
        </form>
        <p className="mt-4 text-center">
          Đã có tài khoản? <a href="/login" className="text-blue-500">Đăng nhập</a>
        </p>
      </div>
    </div>
  );
}

export default Register;