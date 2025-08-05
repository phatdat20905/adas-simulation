import { Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Vehicles from './pages/Vehicles.jsx';
import Simulate from './pages/Simulate.jsx';
import SimulationDetails from './pages/SimulationDetails.jsx';
import AdminPanel from './pages/AdminPanel.jsx';
import Header from './components/Header.jsx';
import Sidebar from './components/Sidebar.jsx';

function App() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);

  return (
    <div className="flex min-h-screen bg-gray-100">
      {user && <Sidebar />}
      <div className="flex-1">
        {user && <Header setUser={setUser} />}
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login setUser={setUser} />} />
          <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register setUser={setUser} />} />
          <Route path="/dashboard" element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} />
          <Route path="/vehicles" element={user ? <Vehicles user={user} /> : <Navigate to="/login" />} />
          <Route path="/simulate" element={user ? <Simulate user={user} /> : <Navigate to="/login" />} />
          <Route path="/simulations/:id" element={user ? <SimulationDetails user={user} /> : <Navigate to="/login" />} />
          <Route path="/admin" element={user && user.role === 'admin' ? <AdminPanel /> : <Navigate to="/login" />} />
          <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;