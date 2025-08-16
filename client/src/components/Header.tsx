import { useNavigate } from 'react-router-dom';
import { logout } from '../services/api';
import type { User } from '../types';
import toast from 'react-hot-toast';

function Header() {
  const navigate = useNavigate();
  const user: User | null = JSON.parse(localStorage.getItem('user') || 'null');

  const handleLogout = async () => {
    try {
      const response = await logout();
      if (response.data.success) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        toast.success('Đăng xuất thành công!');
        navigate('/login');
      } else {
        toast.error(response.data.message);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Đăng xuất thất bại');
    }
  };

  return (
    <header className="bg-white shadow p-4 flex justify-between items-center">
      <div className="flex items-center">
        <img src="/logo.png" alt="Logo" className="w-10 h-10 mr-2" />
        <h1 className="text-xl font-bold">ADAS Motorbike Simulation</h1>
      </div>
      {user && (
        <div className="flex items-center">
          <span className="mr-4">Welcome, {user.username}</span>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Đăng xuất
          </button>
        </div>
      )}
    </header>
  );
}

export default Header;