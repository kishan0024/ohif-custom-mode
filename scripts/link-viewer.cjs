const fs = require('node:fs');
const path = require('node:path');

const customRoot = path.resolve(__dirname, '..');
const viewerRoot = path.resolve(customRoot, '../Radiologist-ohif-viewer');
const appRoot = path.join(viewerRoot, 'platform/app');
const readJSON = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const writeJSON = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n');

if (!fs.existsSync(path.join(appRoot, 'pluginConfig.json')) ||
    !fs.existsSync(path.join(viewerRoot, 'node_modules/react/package.json'))) {
  throw new Error('Expected the existing Radiologist-ohif-viewer with dependencies installed.');
}

const links = [
  [path.join(customRoot, 'node_modules'), path.join(viewerRoot, 'node_modules')],
  ...['extension', 'mode'].map((kind, index) => [
    path.join(viewerRoot, `node_modules/@custom/${kind}-observations`),
    path.join(customRoot, `${index === 0 ? 'extensions' : 'modes'}/observations`),
  ]),
];

// Validate before changing anything; never overwrite an existing package.
for (const [link, target] of links) {
  const existing = fs.lstatSync(link, { throwIfNoEntry: false });
  if (existing && (!existing.isSymbolicLink() ||
      path.resolve(path.dirname(link), fs.readlinkSync(link)) !== target)) {
    throw new Error(`Existing path conflicts with the custom package link: ${link}`);
  }
}

const configTarget = path.join(appRoot, 'public/config/observations.js');
const config = fs.readFileSync(path.join(customRoot, 'config/observations.js'), 'utf8');
if (fs.existsSync(configTarget) && fs.readFileSync(configTarget, 'utf8') !== config) {
  throw new Error(`Existing viewer config differs; review it before linking: ${configTarget}`);
}

for (const [link, target] of links) {
  if (!fs.lstatSync(link, { throwIfNoEntry: false })) {
    fs.mkdirSync(path.dirname(link), { recursive: true });
    fs.symlinkSync(path.relative(path.dirname(link), target), link, 'dir');
  }
}

const pluginsFile = path.join(appRoot, 'pluginConfig.json');
const plugins = readJSON(pluginsFile);
for (const [group, packageName] of [
  ['extensions', '@custom/extension-observations'],
  ['modes', '@custom/mode-observations'],
]) {
  if (!plugins[group].some(entry => (entry.packageName || entry) === packageName)) {
    plugins[group].push({ packageName });
  }
}
writeJSON(pluginsFile, plugins);
fs.writeFileSync(configTarget, config);

const appFile = path.join(appRoot, 'package.json');
const app = readJSON(appFile);
app.scripts['dev:observations'] = 'cross-env NODE_ENV=development OHIF_OPEN=false OHIF_PORT=3006 PROXY_TARGET=http://localhost:3006/pacs/dicom-web PROXY_DOMAIN=http://localhost:8042 PROXY_PATH_REWRITE_FROM=/pacs/dicom-web PROXY_PATH_REWRITE_TO=/dicom-web APP_CONFIG=config/observations.js webpack serve --config .webpack/webpack.pwa.js';
writeJSON(appFile, app);
const rootFile = path.join(viewerRoot, 'package.json');
const root = readJSON(rootFile);
root.scripts['dev:observations'] = 'npm --prefix platform/app run dev:observations';
writeJSON(rootFile, root);
console.log('Custom mode and extension linked to the existing Radiologist-ohif-viewer.');
