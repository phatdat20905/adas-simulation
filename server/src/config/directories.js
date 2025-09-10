import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Tạo thư mục cần thiết cho Uploads & Processed
 */
const setupDirectories = async () => {
  const uploadsDir = join(__dirname, '../../Uploads');
  const uploadsImagesDir = join(uploadsDir, 'images');
  const uploadsVideosDir = join(uploadsDir, 'videos');
  const processedDir = join(__dirname, '../../Processed');
  const processedFramesDir = join(processedDir, 'frames');
  const processedVideosDir = join(processedDir, 'videos');

  const dirs = [
    uploadsDir,
    uploadsImagesDir,
    uploadsVideosDir,
    processedDir,
    processedFramesDir,
    processedVideosDir,
  ];

  for (const dir of dirs) {
    try {
      await fs.mkdir(dir, { recursive: true });
      console.log(`📂 Directory ready: ${dir}`);
    } catch (err) {
      console.error(`❌ Failed to create directory ${dir}:`, err);
    }
  }
};

export default setupDirectories;
