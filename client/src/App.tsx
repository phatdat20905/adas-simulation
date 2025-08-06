import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import Simulate from './pages/Simulate';
import SimulationDetails from './pages/SimulationDetails';
import AdminPanel from './pages/AdminPanel';
import type { User } from './types';

function App() {
  const user: User | null = JSON.parse(localStorage.getItem('user') || 'null');

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/vehicles" element={user ? <Vehicles /> : <Navigate to="/login" />} />
        <Route path="/simulate" element={user ? <Simulate /> : <Navigate to="/login" />} />
        <Route path="/simulations/:id" element={user ? <SimulationDetails /> : <Navigate to="/login" />} />
        <Route
          path="/admin"
          element={user?.role === 'admin' ? <AdminPanel /> : <Navigate to="/dashboard" />}
        />
        <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
