import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const checkedRefs = [];

function assertLocalRef(baseDir, ref, source) {
  if (!ref || /^(?:https?:)?\/\//.test(ref) || ref.startsWith('#') || ref.startsWith('data:')) return;
  const clean = ref.split(/[?#]/, 1)[0];
  const full = resolve(baseDir, clean);
  checkedRefs.push(`${source}: ${ref}`);
  if (!existsSync(full)) errors.push(`Referência ausente em ${source}: ${ref}`);
}

const indexPath = join(root, 'index.html');
const index = readFileSync(indexPath, 'utf8');
for (const match of index.matchAll(/(?:src|href)="([^"]+)"/g)) assertLocalRef(root, match[1], 'index.html');

const cssPath = join(root, 'css', 'styles.css');
const css = readFileSync(cssPath, 'utf8');
for (const match of css.matchAll(/url\(\s*['"]?([^'"\)]+)['"]?\s*\)/g)) {
  const ref = match[1].trim();
  if (ref.startsWith('#')) continue;
  assertLocalRef(dirname(cssPath), ref, 'css/styles.css');
}

function walk(dir) {
  return readdirSync(dir).flatMap(name => {
    const full = join(dir, name);
    if (name === '.git') return [];
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

for (const file of walk(join(root, 'js')).filter(f => f.endsWith('.js'))) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) errors.push(`JavaScript inválido em ${file}: ${result.stderr.trim()}`);
}

const appText = readFileSync(join(root, 'js', 'app.js'), 'utf8');
if (appText.includes('squad-dashboard-v2.1.0')) errors.push('Referência ao nome antigo do repositório encontrada em js/app.js.');

if (errors.length) {
  console.error('Falha na validação do projeto:\n- ' + errors.join('\n- '));
  process.exit(1);
}

console.log(`Validação concluída: ${checkedRefs.length} referências locais verificadas e JavaScript sintaticamente válido.`);
