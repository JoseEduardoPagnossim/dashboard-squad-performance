# V2.63.0 R3 — Correção do validate/CI

## Causa
O hotfix R2 ajustou `js/app.js` para `?v=2.63.0-r2` e declarou `package.json.assetVersion=2.63.0-r2`, mas os outros scripts e folhas de estilo continuaram no `index.html` com `2.63.0-r1`. O validador `scripts/validate-project.mjs` exige o mesmo cache-buster em todos os assets versionados.

## Correção
- `index.html`: todas as referências CSS e JS de `2.63.0-r1` e `2.63.0-r2` para `2.63.0-r3`.
- `package.json.assetVersion`: `2.63.0-r3`. `package.json.version` e `APP_VERSION` permanecem `2.63.0`.
- Asserções de testes atualizadas de forma consistente e novo teste `tests/cache-buster-v2630-r3.test.js`.
- Cadastro de Pré-atendimento da versão R2 preservado, sem alterações de esquema/SQL.

## Aplicação
1. Aplicar **sobre V2.63.0 R2**, sobrescrevendo apenas os arquivos presentes no ZIP R3.
2. Executar `npm run validate` e `npm run check`.
3. Publicar e forçar atualização do navegador (Ctrl+Shift+R).
4. Homologar `Usuários > Criar usuário > Pré-atendimento`, Squad C Estratégico, login e permissões.

Não é necessário executar migration SQL nova para este hotfix. A migration da V2.63.0 e as Edge Functions atualizadas continuam sendo pré-requisitos do cadastro.
