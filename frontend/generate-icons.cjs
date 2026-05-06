const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const inputImagePath = 'C:\\Users\\SSCA\\Pictures\\logo.png';
const resDir = path.join(__dirname, 'android', 'app', 'src', 'main', 'res');

const sizes = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192
};

async function processIcons() {
  if (!fs.existsSync(inputImagePath)) {
    console.error(`Input image not found: ${inputImagePath}`);
    process.exit(1);
  }

  for (const [folder, size] of Object.entries(sizes)) {
    const targetDir = path.join(resDir, folder);
    
    // Ensure directory exists
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const launcherPath = path.join(targetDir, 'ic_launcher.png');
    const launcherRoundPath = path.join(targetDir, 'ic_launcher_round.png');

    try {
      await sharp(inputImagePath)
        .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .toFile(launcherPath);
        
      await sharp(inputImagePath)
        .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .toFile(launcherRoundPath);
        
      console.log(`Generated ${size}x${size} icons in ${folder}`);
    } catch (err) {
      console.error(`Error processing for ${folder}:`, err);
    }
  }
}

processIcons().then(() => console.log('Done generating icons!'));
