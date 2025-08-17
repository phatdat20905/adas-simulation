import { useEffect, useRef } from 'react';
import { Chart } from 'chart.js';
import { CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import type { SensorData } from '../types';

// Đăng ký các scale và thành phần cần thiết
Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface SensorChartProps {
  sensorData: SensorData[];
}

function SensorChart({ sensorData }: SensorChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !sensorData.length) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Hủy chart cũ trước khi tạo mới
    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    const labels = sensorData.map((data) => new Date(data.timestamp).toLocaleTimeString('vi-VN'));
    const speeds = sensorData.map((data) => data.speed);
    const distances = sensorData.map((data) => data.distance_to_object || 0);

    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Tốc độ (km/h)',
            data: speeds,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.5)',
            fill: false,
            tension: 0.4,
          },
          {
            label: 'Khoảng cách (m)',
            data: distances,
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.5)',
            fill: false,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          x: {
            type: 'category',
            title: {
              display: true,
              text: 'Thời gian',
            },
          },
          y: {
            type: 'linear',
            title: {
              display: true,
              text: 'Giá trị',
            },
          },
        },
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: 'Dữ liệu cảm biến theo thời gian',
          },
        },
      },
    });

    // Cleanup: Hủy chart khi component unmount
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [sensorData]);

  return <canvas ref={canvasRef} />;
}

export default SensorChart;