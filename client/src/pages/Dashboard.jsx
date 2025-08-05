import { useState, useEffect } from 'react';
import { getSimulations, getAlerts } from '../services/api';

function Dashboard({ user }) {
  const [simulations, setSimulations] = useState([]);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const simResponse = await getSimulations();
        setSimulations(simResponse.data);
        const alertResponse = await getAlerts();
        setAlerts(alertResponse.data);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-lg font-semibold mb-2">Recent Simulations</h3>
          <ul>
            {simulations.slice(0, 5).map((sim) => (
              <li key={sim._id} className="mb-2">
                <a href={`/simulations/${sim._id}`} className="text-blue-500">
                  {sim.filename} ({sim.status})
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-lg font-semibold mb-2">Recent Alerts</h3>
          <ul>
            {alerts.slice(0, 5).map((alert) => (
              <li key={alert._id} className="mb-2">
                {alert.description} - <span className={`font-semibold ${alert.severity === 'high' ? 'text-red-500' : 'text-yellow-500'}`}>
                  {alert.severity}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;