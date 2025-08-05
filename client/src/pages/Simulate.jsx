import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getVehicles, uploadFile, simulate } from '../services/api';

function Simulate({ user }) {
  const [vehicles, setVehicles] = useState([]);
  const [file, setFile] = useState(null);
  const [vehicleId, setVehicleId] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const response = await getVehicles();
        setVehicles(response.data);
        if (response.data.length > 0) setVehicleId(response.data[0]._id);
      } catch (err) {
        setError('Failed to fetch vehicles');
      }
    };
    fetchVehicles();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !vehicleId) {
      setError('Please select a file and vehicle');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('vehicleId', vehicleId);
      const uploadResponse = await uploadFile(formData);
      const simulationId = uploadResponse.data.simulation._id;
      await simulate({ simulationId });
      navigate(`/simulations/${simulationId}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Simulation failed');
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Upload & Simulate</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow">
        <select
          value={vehicleId}
          onChange={(e) => setVehicleId(e.target.value)}
          className="w-full p-2 mb-4 border rounded"
        >
          <option value="">Select Vehicle</option>
          {vehicles.map((vehicle) => (
            <option key={vehicle._id} value={vehicle._id}>
              {vehicle.licensePlate} - {vehicle.brand} {vehicle.model}
            </option>
          ))}
        </select>
        <input
          type="file"
          accept="image/*,video/mp4"
          onChange={(e) => setFile(e.target.files[0])}
          className="w-full p-2 mb-4 border rounded"
        />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
          Upload & Simulate
        </button>
      </form>
    </div>
  );
}

export default Simulate;