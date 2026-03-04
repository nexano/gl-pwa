// Generate simple SVG icons and convert to PNG-like data URIs
const fs = require('fs');
const path = require('path');

function createSVG(size) {
  const pad = size * 0.15;
  const r = size * 0.35;
  const cx = size / 2;
  const cy = size / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size*0.2}" fill="#f5f0e8"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#c06030" stroke-width="${size*0.04}"/>
  <path d="M${cx} ${cy-r*0.7}v${r*0.7}l${r*0.5} ${r*0.3}" fill="none" stroke="#c06030" stroke-width="${size*0.04}" stroke-linecap="round"/>
  <text x="${cx}" y="${cy+r+pad*0.6}" text-anchor="middle" font-family="Georgia,serif" font-weight="bold" font-size="${size*0.13}" fill="#2c2416">GL</text>
</svg>`;
}

fs.writeFileSync(path.join(__dirname, 'icon-192.svg'), createSVG(192));
fs.writeFileSync(path.join(__dirname, 'icon-512.svg'), createSVG(512));
console.log('SVG icons generated');
