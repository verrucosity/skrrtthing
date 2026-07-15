// Generates src-tauri/icon-source.png (1024x1024): a purple rounded square
// with a target mark. `npm run icon` feeds it to `tauri icon`, which produces
// every platform format in src-tauri/icons/. No image dependencies needed.

import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SIZE = 1024;
const PURPLE = [145, 71, 255];
const WHITE = [255, 255, 255];

// --- drawing -------------------------------------------------------------

const px = new Uint8Array(SIZE * SIZE * 4);
const center = SIZE / 2;
const cornerRadius = SIZE * 0.22;
const squareInset = SIZE * 0.04;

const ringOuter = SIZE * 0.30;
const ringInner = SIZE * 0.21;
const dotRadius = SIZE * 0.10;

function roundedSquareDistance(x, y) {
  // Signed distance to the rounded square (negative = inside).
  const half = SIZE / 2 - squareInset;
  const dx = Math.abs(x - center) - (half - cornerRadius);
  const dy = Math.abs(y - center) - (half - cornerRadius);
  const ax = Math.max(dx, 0);
  const ay = Math.max(dy, 0);
  return Math.hypot(ax, ay) + Math.min(Math.max(dx, dy), 0) - cornerRadius;
}

function coverage(signedDistance) {
  // 1px anti-aliased edge.
  return Math.min(1, Math.max(0, 0.5 - signedDistance));
}

for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    const cx = x + 0.5;
    const cy = y + 0.5;

    const squareAlpha = coverage(roundedSquareDistance(cx, cy));
    if (squareAlpha === 0) continue;

    const r = Math.hypot(cx - center, cy - center);
    const ringAlpha = coverage(r - ringOuter) * coverage(ringInner - r);
    const dotAlpha = coverage(r - dotRadius);
    const markAlpha = Math.max(ringAlpha, dotAlpha);

    const color = [
      PURPLE[0] + (WHITE[0] - PURPLE[0]) * markAlpha,
      PURPLE[1] + (WHITE[1] - PURPLE[1]) * markAlpha,
      PURPLE[2] + (WHITE[2] - PURPLE[2]) * markAlpha,
    ];

    const i = (y * SIZE + x) * 4;
    px[i] = Math.round(color[0]);
    px[i + 1] = Math.round(color[1]);
    px[i + 2] = Math.round(color[2]);
    px[i + 3] = Math.round(squareAlpha * 255);
  }
}

// --- PNG encoding --------------------------------------------------------

const crcTable = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0);
ihdr.writeUInt32BE(SIZE, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 6; // color type: RGBA

// Raw scanlines, each prefixed with filter byte 0.
const raw = Buffer.alloc(SIZE * (SIZE * 4 + 1));
for (let y = 0; y < SIZE; y++) {
  Buffer.from(px.subarray(y * SIZE * 4, (y + 1) * SIZE * 4)).copy(raw, y * (SIZE * 4 + 1) + 1);
}

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk("IHDR", ihdr),
  chunk("IDAT", deflateSync(raw, { level: 9 })),
  chunk("IEND", Buffer.alloc(0)),
]);

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
mkdirSync(join(root, "src-tauri"), { recursive: true });
const out = join(root, "src-tauri", "icon-source.png");
writeFileSync(out, png);
console.log(`wrote ${out} (${png.length} bytes)`);
