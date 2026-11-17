# R30 — Revisão de negociações especiais durante a importação

**Base:** R29.1 + migration R29.2. Não inclui a R24 de bonificação.

## Regras implementadas

1. `Vl Anterior` é a única coluna monetária lida para vendas MRR comuns; `Vl Atual Ativo` é opcional e não é utilizada em cálculos novos. Registros históricos não são recalculados automaticamente.
2. Para o CSV de produtos contratados, `ClienteCNPJ` e `DataCadItemContrato` são mapeados automaticamente para **identificação transitória** de possíveis operações especiais. São utilizados os primeiros sete dígitos do CNPJ, o vendedor, o Squad e janelas de até 60 segundos desde a primeira anotação do grupo. A data/hora com milissegundos é preservada durante a detecção. Nenhum agrupamento é confirmado automaticamente.
3. A seção R30 aparece **somente se houver grupos candidatos com duas ou mais linhas elegíveis**. Para cada grupo, o administrador escolhe `Vendas independentes` ou `Migração / fidelidade`. Na segunda opção, precisa preencher o MRR incremental e a comissão única (inclusive zero, quando correto).
4. As vendas de todos os módulos continuam registradas com seu `Vl Anterior` individual. Nas operações especiais, apenas a linha principal recebe o MRR e a comissão definidos manualmente; as demais recebem MRR e comissão zero. A comissão manual é gravada como snapshot `fixed` e `r30_special=true` e não é recalculada pela reimportação substitutiva R23.
5. Todas as decisões são exigidas antes do início da pré-validação R29. Os módulos do mesmo grupo são enviados juntos (limite de 100 por grupo). A função de finalização confere a presença de exatamente uma linha principal e a quantidade de linhas declarada.
6. A nova tabela `strategy_special_deal_lines_r30` registra lote, grupo interno, linha do CSV, valores, responsável e data da decisão, **sem CNPJ nem prefixo do CNPJ**. A migration também passa a gravar `customer_tax_id = NULL` para **novas vendas**, preservando o CNPJ somente de modo transitório durante o cálculo da identidade. As vendas históricas existentes não são alteradas.
7. O importador mantém controle de tenant e permissões, competências fechadas, idempotência e auditoria de importação. Vendas previamente importadas com regra normal **não são convertidas automaticamente em especiais**: o banco bloqueia essa alteração para exigir ajuste histórico supervisionado.

## Aplicação

1. Fazer backup do Supabase.
2. Garantir que R29.1 e R29.2 estejam aplicadas.
3. Executar `supabase/migrations/MIGRACAO_V2.63.22_NEGOCIACOES_ESPECIAIS_R30.sql` no SQL Editor e verificar sucesso.
4. Publicar os arquivos modificados do ZIP sobre o projeto R29.1 e atualizar o navegador com `Ctrl+Shift+R`.
5. Homologar uma competência aberta com: (a) uma venda comum, (b) vários módulos de um mesmo cliente, (c) dois vendedores diferentes, (d) reimportação idempotente, (e) uma competência fechada.
6. Consultar `strategy_special_deal_lines_r30` após o teste para auditar valores e quantidade de linhas.
7. Apurar comissão pelo fluxo oficial da Gestão Estratégica e conferir a Bonificação **antes** de fechar competência.

## Limites e cuidados

- A janela de 60 segundos e o prefixo de sete dígitos **não são prova de migração**. É uma sugestão sujeita a revisão do administrador; negócios distintos podem coincidir. O responsável deve classificar como independentes quando necessário.
- Identidades de vendas existentes usam a regra anterior do importador. A alteração de armazenamento do CNPJ vale para **novas vendas R30**; para eliminar CNPJs completos legados, é necessário um projeto de saneamento e revisão da auditoria/identidades.
- A correção não reconcilia automaticamente negociações já importadas, comissões apuradas ou bonificações sincronizadas.
- A migration SQL foi revisada estaticamente; não foi aplicada nem testada contra o Supabase de produção.
- Não confundir `Soma de Vl Anterior` com `MRR manual` de uma migração. O primeiro é conferência bruta; o segundo é informado pelo responsável.
- A importação depende de `DataCadItemContrato` e `ClienteCNPJ` estarem preenchidos para detecção. Quando ausentes, as vendas seguem como independentes pela regra anterior; não é possível inferir migração com segurança.

**Commit:** `feat: revisa migracoes e fidelizacoes com mrr e comissao manuais (R30)`
