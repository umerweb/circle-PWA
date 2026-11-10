const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Generate a valid minimal PNG with CRC32 and zlib deflate
function createPngBuffer(width, height, r, g, b) {
  const signature = Buffer.from([137, 80, 78, 72, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bits per channel
  ihdrData[9] = 2; // RGB color type
  ihdrData[10] = 0; // deflate
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // no interlace

  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Raw image data with filter byte 0 per line
  const rawData = Buffer.alloc(height * (1 + width * 3));
  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // filter byte
    for (let x = 0; x < width; x++) {
      // Circle badge design in center
      const cx = width / 2;
      const cy = height / 2;
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      const radius = width * 0.42;

      if (dist <= radius) {
        rawData[offset++] = r; // green
        rawData[offset++] = g;
        rawData[offset++] = b;
      } else {
        rawData[offset++] = 248; // slate-50 background
        rawData[offset++] = 250;
        rawData[offset++] = 252;
      }
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressed);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);

  const typeBuf = Buffer.from(type, 'ascii');
  const crcData = Buffer.concat([typeBuf, data]);

  const crc = Buffer.alloc(4);
  crc.writeInt32BE(calculateCrc(crcData), 0);

  return Buffer.concat([len, typeBuf, data, crc]);
}

function calculateCrc(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return crc ^ -1;
}

const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Emerald Nordic Green: rgb(21, 128, 61)
const png192 = createPngBuffer(192, 192, 21, 128, 61);
fs.writeFileSync(path.join(iconsDir, 'icon-192x192.png'), png192);

const png512 = createPngBuffer(512, 512, 21, 128, 61);
fs.writeFileSync(path.join(iconsDir, 'icon-512x512.png'), png512);

console.log('PWA icons successfully generated in public/icons/');
