const fs = require('fs');
const path = require('path');
const pngToIcoModule = require('png-to-ico');
const pngToIco = pngToIcoModule.default || pngToIcoModule;

const input = path.resolve(__dirname, '../public/apple-icon-72x72.png');
const output = path.resolve(__dirname, '../public/favicon.ico');

console.log('Generating multi-size favicon.ico from:', input);
pngToIco(input)
  .then((buf) => {
    fs.writeFileSync(output, buf);
    console.log('favicon.ico generated:', output, 'bytes:', buf.length);
  })
  .catch((err) => {
    console.error('Failed to generate favicon.ico:', err);
    process.exit(1);
  });
