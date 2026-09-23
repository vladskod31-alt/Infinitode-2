// Rasterize SVG masters -> PNGs (game + Android mipmaps). Run: node tools/gen-assets.mjs
import sharp from 'sharp';
import { mkdirSync, statSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const img = join(root, 'game5/assets/img');
const res = join(root, 'android5/app/src/main/res');

const jobs = [
  // [src, dest, size]
  ['icon.svg', 'icon-1024.png', 1024],
  ['icon.svg', 'icon-512.png', 512],
  ['icon.svg', 'icon-192.png', 192],
  ['icon.svg', 'icon-180.png', 180],
  ['icon.svg', 'favicon-32.png', 32],
  ['banner.svg', 'banner-1200.png', 1200],
  ['bg-map1.svg', 'bg-map1.png', 1280],
  ['bg-map2.svg', 'bg-map2.png', 1280],
  ['bg-map3.svg', 'bg-map3.png', 1280],
  ['bg-map4.svg', 'bg-map4.png', 1280],
  ['bg-map5.svg', 'bg-map5.png', 1280],
  ['bg-map6.svg', 'bg-map6.png', 1280],
];

let total = 0;
for (const [src, dest, size] of jobs) {
  const out = join(img, dest);
  const isBanner = src === 'banner.svg';
  const isBg = src.startsWith('bg-');
  let pipe = sharp(join(img, src));
  if (isBanner) pipe = pipe.resize(1200, 630, { fit: 'fill' });
  else if (isBg) pipe = pipe.resize(1280, 768, { fit: 'fill' });
  else pipe = pipe.resize(size, size, { fit: 'fill' });
  await pipe.png({ compressionLevel: 9, adaptiveFiltering: true }).toFile(out);
  const kb = (statSync(out).size / 1024).toFixed(1);
  total += parseFloat(kb);
  console.log(`OK ${dest} ${kb} KB`);
}

// Android launcher icons (legacy + adaptive fg)
const mip = [
  ['mipmap-mdpi', 48], ['mipmap-hdpi', 72], ['mipmap-xhdpi', 96],
  ['mipmap-xxhdpi', 144], ['mipmap-xxxhdpi', 192],
];
for (const [d, s] of mip) {
  const out = join(res, d, 'ic_launcher.png');
  mkdirSync(dirname(out), { recursive: true });
  await sharp(join(img, 'icon.svg')).resize(s, s, { fit: 'fill' })
    .png({ compressionLevel: 9 }).toFile(out);
  const out2 = join(res, d, 'ic_launcher_round.png');
  await sharp(join(img, 'icon.svg')).resize(s, s, { fit: 'fill' })
    .composite([{ input: Buffer.from(
      `<svg width="${s}" height="${s}"><circle cx="${s / 2}" cy="${s / 2}" r="${s / 2}" fill="#fff"/></svg>`),
      blend: 'dest-in' }]).png({ compressionLevel: 9 }).toFile(out2);
  console.log(`OK ${d} launcher ${s}x${s}`);
}
for (const [d, s] of [['mipmap-xxxhdpi', 432]]) {
  const out = join(res, d, 'ic_launcher_foreground.png');
  await sharp(join(img, 'icon-fg.svg')).resize(s, s, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 }).toFile(out);
  console.log(`OK adaptive foreground ${s}x${s}`);
}
// Play-store style 512 icon
await sharp(join(img, 'icon.svg')).resize(512, 512, { fit: 'fill' })
  .png({ compressionLevel: 9 }).toFile(join(root, 'game5/assets/img/icon-store-512.png'));
console.log('OK icon-store-512.png');
console.log(`Total game PNG: ~${total.toFixed(0)} KB`);
