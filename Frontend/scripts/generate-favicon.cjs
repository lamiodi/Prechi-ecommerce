const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const pngToIcoModule = require('png-to-ico');
const pngToIco = pngToIcoModule.default || pngToIcoModule;

const src = path.resolve(__dirname, '../public/PreachilogoWHITE.png');
const outDir = path.resolve(__dirname, '../public');

const targets = [
  { file: 'favicon-16x16.png', size: 16 },
  { file: 'favicon-32x32.png', size: 32 },
  { file: 'favicon-48x48.png', size: 48 },
  { file: 'apple-icon-72x72.png', size: 72 },
  { file: 'apple-icon-114x114.png', size: 114 },
  { file: 'apple-icon-144x144.png', size: 144 },
  { file: 'apple-touch-icon.png', size: 180 },
  { file: 'favicon-192.png', size: 192 },
  { file: 'favicon-256.png', size: 256 },
];

(async () => {
  try {
    console.log('Preparing square PNGs from:', src);
    await Promise.all(
      targets.map(({ file, size }) =>
        sharp(src)
          .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .png()
          .toFile(path.join(outDir, file))
      )
    );

    const icoInput = [
      path.join(outDir, 'favicon-16x16.png'),
      path.join(outDir, 'favicon-32x32.png'),
      path.join(outDir, 'favicon-48x48.png'),
      path.join(outDir, 'favicon-256.png'),
    ];

    console.log('Generating multi-size favicon.ico from prepared PNGs...');
    const buf = await pngToIco(icoInput);
    const icoPath = path.join(outDir, 'favicon.ico');
    fs.writeFileSync(icoPath, buf);
    console.log('favicon.ico generated:', icoPath, 'bytes:', buf.length);
  } catch (err) {
    console.error('Failed to prepare favicon assets:', err);
    process.exit(1);
  }
})();
