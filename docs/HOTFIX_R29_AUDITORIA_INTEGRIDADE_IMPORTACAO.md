# Hotfix R29 — Auditoria e integridade da importação comercial

## Diagnóstico validado

CSV de outubro/2026 possui vendas entre 01/10 e 30/10 em ordem decrescente. O lote `ef2f82d6-5035-4dd7-b2b7-7487ddb77fe0` possui 99 vendas gravadas entre 14/10 e 30/10 e uma tentativa duplicada. Todas as 100 tentativas possuem o mesmo `created_at`. O sistema enviava os registros aptos em blocos de 100 e interrompia as chamadas subsequentes no primeiro erro do banco; isso é consistente com o resultado. A causa individual precisa ser identificada com a pre-validação R29.

## Entregas

1. RPC `preview_strategy_recurring_chunk_r29`: valida cada bloco com o mesmo motor de importação R5, em uma subtransação que é inteiramente revertida, inclusive os registros temporários de vendas/lotes/eventos. Nenhuma venda real é gravada nesta etapa.
2. Antes de `start_strategy_recurring_batch_v2634`, o frontend pre-valida todos os blocos. Quando há um erro, divide o bloco até encontrar a(s) linha(s) exata(s), registra o motivo e cancela a confirmação antes de qualquer venda ser gravada. Exportação de erros de pre-validação no CSV.
3. Na auditoria por lote, o botão `Comparar arquivo` lê o CSV original localmente e compara cada linha da competência com as vendas daquele lote. Inclui vendedor, produto, data, Squad, `Vl Anterior` e situação. A pesquisa e a exportação incluem todas as linhas, mesmo quando a tabela limita a visualização a 500.
4. A comparação histórica é **informativa**: uma linha `Não localizada neste lote` pode existir em outro lote ou ter sido ignorada por outro motivo. A classificação retroativa de rejeições específicas exige registros originais que o antigo importador não armazenou. Não inventamos motivos.
5. O parser preserva os números das linhas originais mesmo com filtro de competência. Vendas idênticas continuam individuais por ocorrência.

## Implantação

1. Fazer backup e executar `supabase/migrations/MIGRACAO_V2.63.19_PREFLIGHT_IMPORTACAO_R29.sql` no SQL Editor do Supabase.
2. Publicar os arquivos deste ZIP **sobre a R28**. Não incluir R24 (bonificação coletiva desconsiderada).
3. Atualizar navegador (`Ctrl + Shift + R`) e conferir versão `2.63.9-r29`.
4. Gestão Estratégica > Automação > Histórico de importações comerciais > Atualizar histórico > Ver vendas > Selecionar CSV original > Competência outubro/2026 > Comparar arquivo. Buscar `Arthur Santos` e exportar resultado. Esta ação não altera banco.
5. Corrigir apenas pendências de vendedor/Squad/alias/produto identificadas. Quando as 140 linhas elegíveis puderem ser pre-validadas, executar **uma nova importação idempotente**; as 99 vendas confirmadas em outro lote não serão duplicadas. Conferir as duas vendas ausentes de Arthur, a contagem por data e as comissões.
6. Antes da recuperação em produção, verificar competências fechadas, comissões já sincronizadas e demais políticas de conciliação. O lote antigo draft permanece como estava, para auditoria.

## Limitações importantes

- Não modifica nem estorna lote antigo automaticamente.
- Não reconstitui motivos de rejeição de lotes antigos sem seus logs.
- A pre-validação elimina a causa típica de gravação parcial por dado inválido previamente detectável, mas mudanças concorrentes após a pre-validação, queda de rede ou problemas entre chamadas ainda podem gerar lotes `draft`. Nessa situação, não declarar sucesso; consultar o histórico e continuar após avaliação.
- A pré-validação usa chamadas transacionais revertidas; deve ser homologada no Supabase real, inclusive permissões RLS, antes de uso em produção.
- A comparação usa correspondência por data, vendedor, Squad, produto e valor. Linhas idênticas usam a contagem; diferenças em cliente não são comparadas porque as colunas opcionais podem ter sido omitidas no lote legado.

## Testes

`npm run check`: 1.151 testes aprovados, zero falhas. Testes novos cobrem pre-validação, autorização, relatório de auditoria e preservação da linha original do CSV.

## Commit

`fix: audita linhas CSV e pre-valida lotes comerciais antes de gravar (R29)`
