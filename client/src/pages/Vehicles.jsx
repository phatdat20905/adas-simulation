import { useState, useEffect } from 'react';
import { getVehicles, createVehicle, deleteVehicle } from '../services/api';

function Vehicles({ user }) {
  const [vehicles, setVehicles] = useState([]);
  const [formData, setFormData] = useState({ licensePlate: '', brand: '', model: '', year: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const response = await getVehicles();
        setVehicles(response.data);
      } catch (err) {
        setError('Failed to fetch vehicles');
      }
    };
    fetchVehicles();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await createVehicle(formData);
      setVehicles([...vehicles, response.data]);
      setFormData({ licensePlate: '', brand: '', model: '', year: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add vehicle');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteVehicle(id);
      setVehicles(vehicles.filter((v) => v._id !== id));
    } catch (err) {
      setError('Failed to delete vehicle');
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Vehicles</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="mb-6 bg-white p-4 rounded shadow">
        <input
          type="text"
          placeholder="License Plate"
          value={formData.licensePlate}
          onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
          className="w-full p-2 mb-4 border rounded"
        />
        <input
          type="text"
          placeholder="Brand"
          value={formData.brand}
          onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
          className="w-full p-2 mb-4 border rounded"
        />
        <input
          type="text"
          placeholder="Model"
          value={formData.model}
          onChange={(e) => setFormData({ ...formData, model: e.target.value })}
          className="w-full p-2 mb-4 border rounded"
        />
        <input
          type="number"
          placeholder="Year"
          value={formData.year}
          onChange={(e) => setFormData({ ...formData, year: e.target.value })}
          className="w-full p-2 mb-4 border rounded"
        />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
          Add Vehicle
        </button>
      </form>
      <div className="bg-white p-4 rounded shadow">
        <h3 className="text-lg font-semibold mb-2">Your Vehicles</h3>
        <ul>
          {vehicles.map((vehicle) => (
            <li key={vehicle._id} className="flex justify-between items-center mb-2">
              <span>{vehicle.licensePlate} - {vehicle.brand} {vehicle.model} ({vehicle.year})</span>
              <button
                onClick={() => handleDelete(vehicle._id)}
                className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default Vehicles;