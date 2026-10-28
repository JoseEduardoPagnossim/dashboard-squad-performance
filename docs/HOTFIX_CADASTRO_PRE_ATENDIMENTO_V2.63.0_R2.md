# V2.63.0 R2 — Cadastro de Pré-atendimento

## Causa
O HTML de V2.63.0 continha a opção `pre_attendance` no seletor `#newUserRole`, mas `openCreateUser()` substituía `innerHTML` por apenas Técnico e Administrador. O texto auxiliar antigo da janela era outra evidência.

## Correção
O cadastro reutiliza `Usuários > Criar usuário`, com Técnico, Pré-atendimento e Administrador. Quando `Pré-atendimento` é selecionado, mostra `Squad C (Estratégico)` desabilitado, esconde o campo `Nome do técnico no CSV` e envia `squad_code=null` para o backend. A Edge Function existente vincula a conta em `strategy_people` com `functional_team=pre_attendance` e `default_squad_code=C`.

## Instalação
1. Instalar **sobre V2.63.0** (não sobre V2.62.9). Substituir apenas os arquivos do ZIP R2.
2. Limpar cache usando Ctrl+Shift+R, se necessário. O `index.html` atualizado requisita `js/app.js?v=2.63.0-r2`.
3. Testar na área `Usuários > Criar usuário`, selecionar `Pré-atendimento`, conferir Squad C, ausência de técnico CSV e então cadastrar uma conta de homologação.
4. A migration `MIGRACAO_V2.63.0.sql` e a publicação das Edge Functions V2.63.0 continuam obrigatórias para que a gravação no Supabase funcione. Este hotfix **não requer nova migration**.

## Testes
`node --test tests/pre-attendance-create-modal-v2630-r2.test.js` e `node --check js/app.js`. Executar também `npm run check` no repositório completo antes de publicar.
