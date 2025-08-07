import axios from 'axios';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const processADAS = async (filepath, vehicleId, simulationId, userId) => {
  try {
    const response = await axios.post(
      process.env.PYTHON_API_URL || 'http://localhost:5001/process',
      { filepath, vehicleId, simulationId, userId },
      { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
  } catch (error) {
    throw new Error(`Python service error: ${error.response?.data?.detail || error.message}`);
  }
};

export { processADAS };