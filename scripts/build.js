'use strict';
/**
 * Build step: inject data/programs.json into app.js so the page works
 * from file:// with zero server and zero network.
 * Run: node scripts/build.js
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'data', 'programs.json'), 'utf8'));
const appPath = path.join(root, 'app.js');
let app = fs.readFileSync(appPath, 'utf8');

const marker = '/*__SAMPLES__*/';
if (!app.includes(marker)) {
  console.error('app.js is missing the ' + marker + ' placeholder.');
  process.exit(1);
}
app = app.replace(
  /const SAMPLE_PROGRAMS = \/\*__SAMPLES__\*\/[^;]*;/,
  'const SAMPLE_PROGRAMS = ' + JSON.stringify(data, null, 2) + ';'
);
fs.writeFileSync(appPath, app);
console.log('Injected ' + data.length + ' sample programs into app.js.');
