import axios from 'axios';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const processADAS = async (filepath) => {
  try {
    // Call Python microservice (mock response until implemented)
    const response = await axios.post(
      process.env.PYTHON_API_URL || 'http://localhost:5001/process',
      { filepath }
    );
    return response.data;
  } catch (error) {
    // Mock response
    return {
      status: 'completed',
      summary: { mockResult: `Simulated ADAS data for ${filepath}` },
      sensorData: [
        {
          timestamp: new Date().toISOString(),
          speed: 40,
          distance_to_object: 5,
          lane_status: 'departing',
          obstacle_detected: true,
          camera_frame_url: `/Uploads/frames/mock_frame.jpg`,
          alertLevel: 'high',
        },
      ],
    };
    // Uncomment when Python service is ready
    // throw new Error(`Python service error: ${error.message}`);
  }
};

export { processADAS };