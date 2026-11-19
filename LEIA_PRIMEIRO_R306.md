# R30.6 — Aplicação do hotfix incremental

1. Faça backup do projeto e preserve a pasta `.git` existente.
2. Extraia este ZIP diretamente na **raiz** de `dashboard-squad-performance` (onde está `index.html`). Não crie outra pasta `dashboard-squad-performance` dentro dela.
3. Confirme que `js/date-controls.js` foi incluído, que `index.html` importa esse arquivo e que `package.json` tem `assetVersion = 2.63.9-r306`.
4. Execute `npm run check`; só depois faça commit e push, conferindo o GitHub Actions.
5. Teste os formulários de data e competência, notificações e o período global em zoom 125%, 150% e 200%.

**Sem migration SQL.** Nenhum cálculo financeiro foi alterado.

Commit sugerido: `fix: padroniza calendarios e mantem aplicar analise acessivel (R30.6)`

**Inventário técnico:** `docs/MAPEAMENTO_CONTROLES_R306.md`.
