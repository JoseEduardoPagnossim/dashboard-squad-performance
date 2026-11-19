const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const help=html.split('<section id="view-help" class="view">')[1]?.split('</section>')[0]||'';

test('R30.3 guia preserva rota, busca e estrutura de acordeoes',()=>{
 assert.ok(html.includes('<section id="view-help" class="view">'));
 assert.ok(html.includes('id="helpSearchInput"'));
 assert.ok(html.includes('help-playbook-stack'));
 assert.ok(html.includes('GUIA COMPLETO • V2.63.9 · R30.3'));
});
test('R30.3 cobre procedimentos essenciais comerciais e financeiros',()=>{
 for(const label of ['Importar Novo MRR','Revisar migrações de plano','Conciliação de vendedores e líderes','Auditar lotes','Apurar comissões','Conciliar e fechar competência estratégica'])assert.ok(html.includes(label),label);
});
test('R30.3 ensina valor anterior e revisao manual sem confundir preco ativo',()=>{
 assert.ok(html.includes('Somente Vl Anterior'));
 assert.ok(html.includes('Vl Atual Ativo'));
 assert.ok(html.includes('comissão total da operação'));
 assert.ok(html.includes('prefixo de sete dígitos'));
});
test('R30.3 inclui aparencia institucional e squad de maneira independente',()=>{
 assert.ok(html.includes('Alterar imagem institucional comum — R30.2'));
 assert.ok(html.includes('Personalizar o tema individual do Squad'));
 assert.ok(html.includes('Salvar imagem comum'));
});
test('R30.3 cobre pre atendimento, relatorios e perfis',()=>{
 for(const label of ['Pré-atendimento — Squad C','Exportar relatórios e memória de cálculo','Gerenciar usuários, permissões e senha'])assert.ok(html.includes(label),label);
});
test('R30.3 sincroniza versao de assets e documentacao',()=>{
 assert.equal(JSON.parse(read('package.json')).assetVersion,'2.63.9-r3062');
 assert.ok(html.includes('js/app.js?v=2.63.9-r3062'));
 assert.ok(read('docs/MANUAL_COMO_USAR_R303.md').includes('24 procedimentos'));
});
