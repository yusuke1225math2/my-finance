import { cpSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectDir = resolve(scriptDir, '..');
const buildDir = resolve(projectDir, 'build');
const sourceManifest = resolve(projectDir, 'src', 'appsscript.json');
const targetManifest = resolve(buildDir, 'appsscript.json');

mkdirSync(buildDir, { recursive: true });
cpSync(sourceManifest, targetManifest);
