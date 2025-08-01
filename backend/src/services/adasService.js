import axios from 'axios';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const processADAS = async (filepath) => {
  try {
    // Call Python microservice (mock response until Python service is implemented)
    const response = await axios.post(
      process.env.PYTHON_API_URL || 'http://localhost:5001/process',
      { filepath }
    );
    return response.data;
  } catch (error) {
    // Mock response for now
    return { mockResult: `Simulated ADAS data for ${filepath}` };
    // Uncomment below when Python service is ready
    // throw new Error(`Python service error: ${error.message}`);
  }
};

export { processADAS };