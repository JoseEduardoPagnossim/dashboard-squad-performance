# V2.60.5 — Resultado por Squad

## Objetivo
Consolidar a contribuição econômica por Squad usando a mesma participação econômica dos eventos da Fase 5, sem criar um total artificial entre Receita Direta, Influenciada e Protegida.

## Regra de atribuição
- cada evento econômico continua existindo uma única vez;
- `attribution_share` explícita tem precedência;
- o saldo de um evento com participantes sem percentual é dividido de forma determinística;
- o rateio é calculado antes do filtro de Squad;
- eventos com participantes de Squads diferentes são distribuídos conforme a participação de cada atribuição;
- a soma de créditos explícitos acima de 100% continua bloqueada pelo guard da V2.60.4.

## Indicadores por Squad
Cada Squad expõe separadamente:
- Receita Direta, MRR/ARR direto e eventos diretos;
- Receita Influenciada, MRR/ARR influenciado e eventos influenciados;
- Receita Protegida, MRR/ARR protegido e eventos protegidos;
- técnicos participantes, participações e eventos creditados.

## Integridade econômica
Direta, Influenciada e Protegida possuem significados diferentes e não são somadas como um único resultado. ROI, retorno líquido e relação com custos ficam reservados para a V2.60.6.

## Segurança
A RPC `get_strategy_result_squad_summary` exige acesso estratégico agregado (`aggregates`) e não expõe nomes ou valores individuais por técnico.

## Banco
Executar `MIGRACAO_V2.60.5.sql` depois da V2.60.4. A versão cria somente a RPC agregada por Squad; nenhuma tabela nova é criada.
