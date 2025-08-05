import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getSensorData, getAlerts } from '../services/api';
import SensorChart from '../components/SensorChart';

function SimulationDetails({ user }) {
  const { id } = useParams();
  const [sensorData, setSensorData] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const sensorResponse = await getSensorData(id);
        setSensorData(sensorResponse.data);
        const alertResponse = await getAlerts();
        setAlerts(alertResponse.data.filter((alert) => alert.simulationId === id));
      } catch (err) {
        setError('Failed to fetch simulation details');
      }
    };
    fetchData();
  }, [id]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Simulation Details</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <div className="bg-white p-4 rounded shadow mb-6">
        <h3 className="text-lg font-semibold mb-2">Sensor Data</h3>
        <SensorChart sensorData={sensorData} />
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2">Timestamp</th>
              <th className="border p-2">Speed (km/h)</th>
              <th className="border p-2">Distance (m)</th>
              <th className="border p-2">Lane Status</th>
              <th className="border p-2">Obstacle</th>
              <th className="border p-2">Alert Level</th>
              <th className="border p-2">Frame</th>
            </tr>
          </thead>
          <tbody>
            {sensorData.map((data) => (
              <tr key={data._id}>
                <td className="border p-2">{new Date(data.timestamp).toLocaleString()}</td>
                <td className="border p-2">{data.speed}</td>
                <td className="border p-2">{data.distance_to_object || 'N/A'}</td>
                <td className="border p-2">{data.lane_status}</td>
                <td className="border p-2">{data.obstacle_detected ? 'Yes' : 'No'}</td>
                <td className="border p-2">{data.alertLevel}</td>
                <td className="border p-2">
                  {data.camera_frame_url && (
                    <img src={`http://localhost:5000${data.camera_frame_url}`} alt="Frame" className="w-24 h-24 object-cover" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-white p-4 rounded shadow">
        <h3 className="text-lg font-semibold mb-2">Alerts</h3>
        <ul>
          {alerts.map((alert) => (
            <li key={alert._id} className="mb-2">
              {alert.description} - <span className={`font-semibold ${alert.severity === 'high' ? 'text-red-500' : 'text-yellow-500'}`}>
                {alert.severity}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default SimulationDetails;