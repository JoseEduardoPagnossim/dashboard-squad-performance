# R29.2 — Validar líderes pelo Squad financeiro na importação comercial

## Diagnóstico

A R20/R21 permite vincular um administrador (`profiles.role = super_admin`) ao Squad financeiro por competência em `super_admin_commissions`. A conciliação no frontend e o alias já aceitam esses vínculos. Porém, as funções oficiais de importação MRR e Não MRR ainda exigiam `strategy_people.default_squad_code = squad` antes de analisar o perfil, impedindo a importação de líderes legitimamente conciliados. Na pré-validação R29.1, o erro aparecia como `Pessoa nao conciliada no Squad da venda`.

## Correção

- Para **técnicos e Pré-atendimento**, mantém a verificação de `default_squad_code` e as regras operacionais existentes.
- Para **líderes `super_admin` ativos**, valida o Squad A/B/D/E contra `super_admin_commissions`, com **mesmo `organization_id`, `user_id`, mês e ano da data da venda**; o Squad C permanece proibido para líderes.
- Preserva alias aprovado/nome exato, catálogo, competência fechada, idempotência, comissões e eventos financeiros. Não atribui ao líder produção de atendimento.
- Aplica a mesma regra ao importador de mercadorias. A pré-validação R29.1 chama a função MRR e herda a correção automaticamente.

## Aplicação

1. Faça backup do Supabase e homologue em ambiente de testes.
2. Garanta que R29 e R29.1 já estão aplicadas.
3. No SQL Editor, execute `supabase/migrations/MIGRACAO_V2.63.21_LIDERES_FINANCEIROS_IMPORTACAO_R292.sql`.
4. Não é preciso publicar arquivos de frontend ou alterar `strategy_people.default_squad_code` de líderes.
5. Reabra a pré-validação do CSV outubro/2026. As quatro linhas de Heitor Drago Gois (Squad A) não devem mais apresentar o erro de Squad, desde que o vínculo de outubro esteja salvo e o alias esteja aprovado. **Não confirme a importação** até a prévia inteira passar e a competência estar aberta.
6. Confira que um líder em Squad divergente/sem vínculo no mês permanece bloqueado; que técnicos e Pré-atendimento continuam validados normalmente; e que o lote parcial original continua intacto.

## Limites

A migração altera somente definições de duas funções SQL. Não altera registros históricos nem marca lotes `draft` como concluídos. Os testes automatizados são locais e não substituem homologação no Supabase real.

Commit sugerido: `fix: valida squad financeiro mensal dos lideres na importacao (R29.2)`
