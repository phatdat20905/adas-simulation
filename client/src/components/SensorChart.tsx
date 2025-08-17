import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto'; // Import Chart.js với auto-registration

interface SensorData {
  timestamp: string;
  speed: number;
  distance_to_object: number | null;
  lane_status: string;
  obstacle_detected: boolean;
  camera_frame_url: string | null;
}

interface SensorChartProps {
  sensorData: SensorData[];
}

const SensorChart: React.FC<SensorChartProps> = ({ sensorData }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (chartRef.current) {
      if (chartInstance.current) {
        chartInstance.current.destroy(); // Hủy chart cũ nếu có
      }

      const ctx = chartRef.current.getContext('2d');
      if (ctx) {
        chartInstance.current = new Chart(ctx, {
          type: 'line', // Sử dụng 'line' chart
          data: {
            labels: sensorData.map(data => new Date(data.timestamp).toLocaleTimeString()),
            datasets: [{
              label: 'Speed (km/h)',
              data: sensorData.map(data => data.speed),
              borderColor: '#36A2EB',
              backgroundColor: 'rgba(54, 162, 235, 0.2)',
              fill: true,
              tension: 0.1,
            }],
          },
          options: {
            responsive: true,
            scales: {
              x: {
                title: {
                  display: true,
                  text: 'Thời gian',
                },
              },
              y: {
                title: {
                  display: true,
                  text: 'Tốc độ (km/h)',
                },
                beginAtZero: true,
              },
            },
          },
        });
      }
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [sensorData]);

  return <canvas ref={chartRef} />;
};

export default SensorChart;