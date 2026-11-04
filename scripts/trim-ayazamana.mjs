// One-off: trims the dark border from the web-size Ayazamana stand-in poster
// (columns 0–9 and 418–419 are border; the art is columns 10–417). Run once with
// `node scripts/trim-ayazamana.mjs`. Not needed once the original file arrives.
// The untrimmed copy is kept in reference/extracted-images/ayazamana-poster-420px-cropped.jpg.
import sharp from 'sharp';

const src = 'src/content/programs/ayazamana-poster.jpg';
const out = 'src/content/programs/ayazamana-poster.png';
await sharp(src).extract({ left: 10, top: 0, width: 408, height: 525 }).png().toFile(out);
console.log(`wrote ${out}`);
