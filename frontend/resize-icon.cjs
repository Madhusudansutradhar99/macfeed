// resize-icon.cjs
// This script resizes a source logo to all required Android mipmap icon sizes using sharp.
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Source image path (absolute)
const src = 'C:/Users/SSCA/Pictures/logo.png';

// Output icon definitions
const icons = [
  { out: 'android/app/src/main/res/mipmap-mdpi/ic_launcher.png', size: 48 },
  { out: 'android/app/src/main/res/mipmap-hdpi/ic_launcher.png', size: 72 },
  { out: 'android/app/src/main/res/mipmap-xhdpi/ic_launcher.png', size: 96 },
  { out: 'android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png', size: 144 },
  { out: 'android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png', size: 192 },
  { out: 'android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png', size: 48 },
  { out: 'android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png', size: 72 },
  { out: 'android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png', size: 96 },
  { out: 'android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png', size: 144 },
  { out: 'android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png', size: 192 },
];

(async () => {
  for (const icon of icons) {
    const outPath = path.resolve(__dirname, icon.out);
    // Ensure directory exists
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    await sharp(src)
      .resize(icon.size, icon.size)
      .toFile(outPath);
    console.log(`Generated: ${icon.out} (${icon.size}x${icon.size})`);
  }
  console.log('All icons generated successfully.');
})();
