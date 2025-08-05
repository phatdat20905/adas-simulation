import { useState, useEffect } from 'react';
import { getUsers, getVehicles, getSimulations } from '../services/api';

function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [simulations, setSimulations] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userResponse, vehicleResponse, simResponse] = await Promise.all([
          getUsers(),
          getVehicles(),
          getSimulations(),
        ]);
        setUsers(userResponse.data);
        setVehicles(vehicleResponse.data);
        setSimulations(simResponse.data);
      } catch (err) {
        setError('Failed to fetch admin data');
      }
    };
    fetchData();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Admin Panel</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-lg font-semibold mb-2">Users</h3>
          <ul>
            {users.map((user) => (
              <li key={user._id} className="mb-2">
                {user.username} ({user.role})
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-lg font-semibold mb-2">Vehicles</h3>
          <ul>
            {vehicles.map((vehicle) => (
              <li key={vehicle._id} className="mb-2">
                {vehicle.licensePlate} - {vehicle.brand} {vehicle.model}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-lg font-semibold mb-2">Simulations</h3>
          <ul>
            {simulations.map((sim) => (
              <li key={sim._id} className="mb-2">
                <a href={`/simulations/${sim._id}`} className="text-blue-500">
                  {sim.filename} ({sim.status})
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;