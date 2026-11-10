# R23 — Catálogo Comercial independente e reimportação de comissões

**Base:** pacote de projeto enviado com hotfix R22 `js/app.js` aplicado. **Publicação:** primeiro migration no Supabase em homologação, depois publicar arquivos da R23. Não executar estorno para esta atualização.

## Interface

- `Gestão Estratégica > Automação > Catálogo Comercial` aparece imediatamente após a central de fontes e **antes** do assistente CSV, independente de qualquer etapa de importação.
- Catálogo permanece no mesmo banco e com as quatro regras (`full`, `percentage`, `net_after_third_party`, `fixed`), com origem MRR/Não MRR, busca por produto e pré-cadastro opcional a partir do CSV.
- Alteração manual da regra continua usando a RPC `set_strategy_commercial_commission_v2633` e não altera comissões existentes.

## Reimportação substitutiva controlada

- Na etapa **4 · Confirmar**, a opção **Reimportação substitutiva: recalcular com as regras atuais** vem selecionada; o usuário pode desligá-la.
- A importação comercial original continua idempotente: vendas já identificadas no banco são marcadas `duplicate` em `strategy_*_import_attempts`; não se cria nova venda, evento econômico ou MRR.
- Somente **depois de o lote ser concluído**, o dashboard chama `replace_strategy_batch_commissions_r23(batch, false)` para prévia. Uma segunda confirmação explícita autoriza `(..., true)`.
- A RPC considera **apenas as identidades `duplicate` do lote selecionado** e com comissões já gravadas no ledger `strategy_sales_commissions`. Ela calcula o novo valor usando a regra vigente **do mesmo produto e da mesma origem**; não reescreve valores brutos nem os snapshots da venda.
- Se não existe comissão gravada para aquela venda, a RPC conta `missingLedger` e **não inventa uma comissão retroativa**. Apurar normalmente via Bonificação antes de tentar corrigir este caso.
- Regras não aprovadas não são usadas; são contadas como `pendingRule`.
- Uma reexecução da mesma RPC para o mesmo lote ignora comissões já tratadas (`alreadyApplied`), via chave única de auditoria.
- **Proteções de fechamento:** competência estratégica fechada, Squad operacional fechado ou comissão já transferida para Bonificação operacional/administrador geram bloqueio transacional. Nesses casos, não aplicar sobre a folha: revisar/reabrir pelo procedimento oficial e conciliar a Bonificação.
- O histórico `strategy_commission_replacements_r23` preserva por venda e lote valor, status, regra, revisão antes/depois, autor e horário. Sem alteração dos snapshots anteriores.

**Limite deliberado:** “substituição” nesta R23 refere-se à **comissão** de vendas existentes reidentificadas como duplicadas. Não substitui preço, pessoa, produto ou valor da venda original; mudanças nesses dados exigem um processo auditável próprio. Não existe sincronização automática da comissão revista com valores de Bonificação já transferidos: a RPC bloqueia quando detecta esses valores.

## Ordem de aplicação

1. Backup e teste em homologação; confirmar que R20–R22 e o motor V2.63.6 estão ativos.
2. Executar `supabase/migrations/MIGRACAO_V2.63.17_REIMPORTACAO_COMISSOES_R23.sql` no SQL Editor, conferir `Success`.
3. Publicar `index.html`, `js/app.js`, `package.json` e demais arquivos alterados do pacote; limpar cache (`Ctrl+F5`).
4. Abrir **Automação > Catálogo Comercial**, testar edição de uma regra sem importar CSV.
5. Usar um lote de homologação em competência aberta com venda já importada, marcar recálculo, importar, comparar prévia e confirmar. Conferir o ledger e `strategy_commission_replacements_r23`.
6. Verificar explicitamente tentativas duplicadas, competência fechada, conflito com Bonificação e segunda execução idempotente. A suíte Node verifica estrutura e integração, **não executa SQL em banco real**.

## Commit

`feat: separa catalogo comercial e recalcula comissoes em reimportacao auditada (R23)`
