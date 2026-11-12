const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const js=fs.readFileSync(path.join(root,'js/app.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const css=fs.readFileSync(path.join(root,'css/styles.css'),'utf8');
test('troca de Squad revalida o tema salvo ignorando cache obsoleto',()=>{
  const switchBlock=js.slice(js.indexOf('async function selectSquad('),js.indexOf('function requireSpecificSquad('));
  assert.match(switchBlock,/await ensureSquadTheme\(code,\{force:true,apply:false\}\)/);
  assert.match(switchBlock,/selectionSeq!==state\.squadSelectionSeq/);
  assert.ok(switchBlock.indexOf('await ensureSquadTheme(')<switchBlock.indexOf('applyTheme(state.theme)'));
});
test('primeiro card individual usa a imagem persistida, independente da variavel --hero-img',()=>{
  assert.match(html,/<div class="hero card glass">\s*<img class="individual-hero-art hidden"/);
  assert.match(js,/const individualArt=\$\('#view-individual \.individual-hero-art'\)/);
  assert.match(js,/individualArt\.src=safeBg/);
  assert.match(js,/individualArt\.removeAttribute\('src'\)/);
  assert.match(css,/#view-individual \.individual-hero-art\{[^}]*object-fit:cover/);
  assert.match(css,/#view-individual \.hero::before\{/);
});
