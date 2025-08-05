import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function SensorChart({ sensorData }) {
  const labels = sensorData.map(data => new Date(data.timestamp).toLocaleTimeString());
  const speedData = sensorData.map(data => data.speed);
  const distanceData = sensorData.map(data => data.distance_to_object || 0);

  const data = {
    labels,
    datasets: [
      {
        label: 'Speed (km/h)',
        data: speedData,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
      {
        label: 'Distance to Object (m)',
        data: distanceData,
        borderColor: 'rgb(255, 99, 132)',
        tension: 0.1,
      },
    ],
  };

  return (
    <div className="p-4">
      <Line data={data} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
    </div>
  );
}

export default SensorChart;