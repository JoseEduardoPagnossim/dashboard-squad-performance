# V2.58.2 — Custo por Resolução

## Objetivo
Adicionar o segundo indicador econômico da Fase 3 sem confundir volume de atendimento com resolução efetiva.

## Fonte de resolução
A base operacional atual possui `Quantidade` de atendimentos, mas não possui um campo independente que comprove resolução. Por isso a V2.58.2 cria `strategy_resolution_metrics`, uma base estratégica explícita por técnico, competência e Squad.

A quantidade de resoluções pode ser preenchida manualmente nesta versão e o contrato já possui `source = manual | csv | api` para automação futura.

O sistema **não copia atendimentos automaticamente para resoluções**.

## Fórmulas
- `custo por resolução = custo total consolidado / resoluções`
- `taxa de resolução = resoluções / atendimentos`
- técnico: `custo pessoal do técnico / resoluções do técnico`

Se resoluções forem zero, o custo por resolução permanece sem valor em vez de dividir por zero.

## Escopos
### Operação
Usa o custo total do escopo estratégico selecionado e a soma das resoluções registradas.

### Squad
Usa custo pessoal + custo operacional já rateado do Squad, dividido pelas resoluções registradas no próprio Squad.

### Técnico
Usa apenas custo pessoal do técnico. Custos compartilhados não são rateados artificialmente até o indivíduo.

## Validações
- resolução não pode ser negativa;
- na interface, resoluções não podem superar os atendimentos do técnico na competência;
- competência fechada não aceita insert/update/delete da base de resolução;
- detalhes individuais seguem a permissão de custos pessoais;
- agregados são disponibilizados por RPC para usuários com acesso estratégico agregado.

## Fechamento e histórico
As linhas de resolução ficam imutáveis quando a competência é fechada porque as policies usam `is_strategy_competence_open`. Assim, o histórico de custo por resolução não é reescrito por alterações posteriores.

## Banco
Executar `supabase/migrations/MIGRACAO_V2.58.2.sql` antes de usar o indicador.

## Regra do motor
`EF-0.3.0-cost-per-resolution`
