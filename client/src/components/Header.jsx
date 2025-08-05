import { useNavigate } from 'react-router-dom';

function Header({ setUser }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    navigate('/login');
  };

  return (
    <header className="bg-white shadow p-4 flex justify-between items-center">
      <h1 className="text-2xl font-bold">ADAS Motorbike Simulation</h1>
      <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
        Logout
      </button>
    </header>
  );
}

export default Header;