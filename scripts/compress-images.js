const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const { performance } = require('perf_hooks');

const imageConfig = {
  jpeg: {
    quality: 80,
    progressive: true,
  },
  webp: {
    quality: 75,
    effort: 6,
  },
  png: {
    compressionLevel: 9,
    palette: true,
  },
};

async function optimizeImage(inputPath, outputPath, options = {}) {
  const startTime = performance.now();
  
  try {
    const image = sharp(inputPath);
    const metadata = await image.metadata();
    
    // Resize if image is too large
    if (metadata.width > 800 || metadata.height > 600) {
      image.resize(800, 600, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }
    
    // Convert to WebP for better compression
    if (options.convertToWebp) {
      outputPath = outputPath.replace(/\.[^.]+$/, '.webp');
      await image
        .webp(imageConfig.webp)
        .toFile(outputPath);
    } else {
      // Optimize based on original format
      switch (metadata.format) {
        case 'jpeg':
          await image
            .jpeg(imageConfig.jpeg)
            .toFile(outputPath);
          break;
        case 'png':
          await image
            .png(imageConfig.png)
            .toFile(outputPath);
          break;
        default:
          await image.toFile(outputPath);
      }
    }
    
    const endTime = performance.now();
    const originalSize = (await fs.stat(inputPath)).size;
    const optimizedSize = (await fs.stat(outputPath)).size;
    const savings = ((originalSize - optimizedSize) / originalSize * 100).toFixed(2);
    
    console.log(`
      Optimized: ${path.basename(inputPath)}
      Original size: ${(originalSize / 1024).toFixed(2)}KB
      Optimized size: ${(optimizedSize / 1024).toFixed(2)}KB
      Savings: ${savings}%
      Time taken: ${(endTime - startTime).toFixed(2)}ms
    `);
    
  } catch (error) {
    console.error(`Error optimizing ${inputPath}:`, error);
    throw error;
  }
}

async function processDirectory(directory) {
  try {
    const files = await fs.readdir(directory);
    const imageFiles = files.filter(file => /\.(jpg|jpeg|png)$/i.test(file));
    
    console.log(`Found ${imageFiles.length} images to process`);
    
    const optimizationPromises = imageFiles.map(file => {
      const inputPath = path.join(directory, file);
      const outputPath = path.join(directory, 'optimized', file);
      return optimizeImage(inputPath, outputPath, { convertToWebp: true });
    });
    
    await Promise.all(optimizationPromises);
    console.log('All images have been optimized!');
    
  } catch (error) {
    console.error('Error processing directory:', error);
    throw error;
  }
}

// Create optimized directory if it doesn't exist
async function ensureOptimizedDir(directory) {
  const optimizedDir = path.join(directory, 'optimized');
  try {
    await fs.mkdir(optimizedDir, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
  }
}

// Main execution
async function main() {
  const assetsDir = path.join(__dirname, '../assets');
  
  try {
    await ensureOptimizedDir(assetsDir);
    await processDirectory(assetsDir);
  } catch (error) {
    console.error('Error in main execution:', error);
    process.exit(1);
  }
}

main(); 