// Prepares src-tauri/icon-source.png for `tauri icon` (run via `npm run icon`).
//
// If an app-icon.png exists in the repo root, it is used as-is — drop your
// own 1024x1024 PNG there to brand the app. Otherwise a plain flat purple
// square is written as a neutral placeholder so the build always works.

import { deflateSync } from "node:zlib";
import { writeFileSync, copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "src-tauri", "icon-source.png");
const custom = join(root, "app-icon.png");

mkdirSync(join(root, "src-tauri"), { recursive: true });

if (existsSync(custom)) {
  copyFileSync(custom, out);
  console.log(`using custom icon: ${custom}`);
  process.exit(0);
}

// --- flat placeholder ------------------------------------------------------

const SIZE = 1024;
const COLOR = [145, 71, 255]; // #9147ff
const cornerRadius = SIZE * 0.22;
const inset = SIZE * 0.04;

const px = new Uint8Array(SIZE * SIZE * 4);
const center = SIZE / 2;

for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    // Signed distance to the rounded square, for a 1px anti-aliased edge.
    const half = SIZE / 2 - inset;
    const dx = Math.abs(x + 0.5 - center) - (half - cornerRadius);
    const dy = Math.abs(y + 0.5 - center) - (half - cornerRadius);
    const dist =
      Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) +
      Math.min(Math.max(dx, dy), 0) -
      cornerRadius;
    const alpha = Math.min(1, Math.max(0, 0.5 - dist));
    if (alpha === 0) continue;

    const i = (y * SIZE + x) * 4;
    px[i] = COLOR[0];
    px[i + 1] = COLOR[1];
    px[i + 2] = COLOR[2];
    px[i + 3] = Math.round(alpha * 255);
  }
}

// --- PNG encoding ----------------------------------------------------------

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
  const buf = Buffer.alloc(12 + data.length);
  buf.writeUInt32BE(data.length, 0);
  buf.write(type, 4, "ascii");
  data.copy(buf, 8);
  buf.writeUInt32BE(crc32(buf.subarray(4, 8 + data.length)), 8 + data.length);
  return buf;
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0);
ihdr.writeUInt32BE(SIZE, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 6; // color type: RGBA

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

writeFileSync(out, png);
console.log(`wrote flat placeholder: ${out} (${png.length} bytes)`);
