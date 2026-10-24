# V2.60.8 — Snapshots, histórico e evolução do Resultado

## Objetivo
Congelar o Resultado econômico no fechamento da competência e permitir a comparação histórica sem recalcular meses antigos com regras, custos ou atribuições atuais.

## Snapshot oficial
A migration cria `strategy_result_snapshots` com versão `RS-1.0.0` e motor `RE-0.9.0-result-history`.

Cada fotografia fica vinculada a:
- organização;
- competência;
- revisão do fechamento;
- revisão do snapshot financeiro oficial;
- fingerprint do payload;
- origem (`close` ou `legacy_backfill`).

O snapshot guarda, separadamente:
- Receita Direta e recorrência associada;
- Receita Influenciada e recorrência associada;
- Receita Protegida e recorrência associada;
- custo e FTE congelados;
- retorno líquido direto;
- ROI direto;
- cobertura de custo;
- impacto influenciado por R$ de custo;
- impacto protegido por R$ de custo;
- visão consolidada da operação e visão por Squad.

## Regra histórica
O histórico nunca recalcula competências fechadas a partir do estado atual das tabelas.

A leitura usa o último snapshot revisionado de cada competência. Ao filtrar um Squad, a série histórica usa somente a fotografia daquele Squad. Em `Todos`, utiliza a fotografia consolidada da operação.

## Bloqueio de mutação
Eventos e atribuições de Resultado ficam bloqueados no banco enquanto a competência estiver fechada. Para corrigir um lançamento é necessário:
1. reabrir a competência;
2. corrigir o evento ou atribuição;
3. fechar novamente;
4. gerar uma nova revisão de snapshot.

A revisão anterior permanece preservada para auditoria.

## Backfill
Competências já fechadas antes da V2.60.8 podem receber snapshot por `legacy_backfill`.

Esse registro é uma reconstrução usando a melhor base disponível no momento da migration. Por isso, a interface identifica essa origem e não a apresenta como fotografia capturada no fechamento original.

## Evolução
A interface apresenta:
- competências congeladas;
- último fechamento;
- variação de Receita Direta;
- variação do ROI direto em pontos percentuais;
- variação de Receita Protegida;
- série histórica de custo, Receita Direta, Influenciada, Protegida, MRR protegido e cobertura de custo.

## Guardrails
- Receita Direta, Influenciada e Protegida continuam independentes.
- ROI continua usando apenas Receita Direta.
- histórico é fotografia, não projeção.
- `legacy_backfill` é reconstrução e permanece identificado.
- custo histórico vem da mesma revisão financeira congelada no fechamento.
