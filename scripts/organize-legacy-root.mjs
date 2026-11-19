// R30.2: organizar apenas entregaveis historicos na raiz.
// Seguro para executar mais de uma vez; nao toca index.html, js, css, assets,
// migrations, configuracao do Git ou arquivos de testes.
import { readdirSync, existsSync, mkdirSync, renameSync, statSync, readFileSync, unlinkSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const archive = join(root, 'docs', 'releases', 'legacy-root');
mkdirSync(archive, { recursive: true });
const prefixes = ['INSTRUCOES_', 'APLICACAO_', 'COMMIT', 'LEIA-ME_', 'LEIA-ME-', 'LEIA_PRIMEIRO', 'VALIDACAO_', 'TESTES_'];
let moved = 0;
for (const name of readdirSync(root)) {
  const source = join(root, name), destination = join(archive, name);
  if (!statSync(source).isFile() || !(name.endsWith('.patch') || prefixes.some(p => name.startsWith(p)))) continue;
  if (existsSync(destination)) {
    // Nunca sobrescrever um documento historico ja arquivado.
    const old = readFileSync(source), archived = readFileSync(destination);
    if (old.equals(archived)) { unlinkSync(source); moved++; console.log(`Duplicata historica removida da raiz: ${name}`); }
    else console.log(`Conflito preservado na raiz: ${name} (versao do arquivo e diferente)`);
    continue;
  }
  renameSync(source, destination);
  moved++;
}
console.log(`Organizacao concluida: ${moved} arquivo(s) movido(s) para docs/releases/legacy-root/`);
