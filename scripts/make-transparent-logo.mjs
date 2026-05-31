import fs from 'node:fs';
import { PNG } from 'pngjs';

const inputPath = 'public/Sigma_Arome_Logo.png';
const outputPath = 'public/Sigma_Arome_Logo_Transparent.png';

const png = PNG.sync.read(fs.readFileSync(inputPath));

for (let y = 0; y < png.height; y += 1) {
  for (let x = 0; x < png.width; x += 1) {
    const idx = (png.width * y + x) << 2;
    const red = png.data[idx];
    const green = png.data[idx + 1];
    const blue = png.data[idx + 2];
    const min = Math.min(red, green, blue);
    const max = Math.max(red, green, blue);
    const chroma = max - min;

    if (min > 248 && chroma < 8) {
      png.data[idx + 3] = 0;
    } else if (min > 238 && chroma < 14) {
      png.data[idx + 3] = Math.max(0, Math.min(255, (248 - min) * 26));
    }
  }
}

fs.writeFileSync(outputPath, PNG.sync.write(png));
