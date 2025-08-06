import { useNavigate } from 'react-router-dom';
import type { User } from '../types';

function Header() {
  const navigate = useNavigate();
  const user: User | null = JSON.parse(localStorage.getItem('user') || 'null');

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <header className="bg-white shadow p-4 flex justify-between items-center">
      <div className="flex items-center">
        <img src="/logo.png" alt="Logo" className="w-10 h-10 mr-2" />
        <h1 className="text-xl font-bold">ADAS Motorbike Simulation</h1>
      </div>
      {user && (
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Logout
        </button>
      )}
    </header>
  );
}

export default Header;