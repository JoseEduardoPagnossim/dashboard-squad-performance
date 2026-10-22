# Gestão Estratégica — Resultado Executivo V2.57.5

## Objetivo
Entregar uma leitura mensal de Diretoria conectando custo, produção e qualidade. O módulo continua isolado do operacional e consome somente dados agregados.

## Indicadores principais
- Custo total = pessoas + operação.
- Custo por atendimento = custo total / atendimentos.
- Atendimentos por FTE = atendimentos / FTE atribuído.
- Spread de eficiência = variação percentual da produção - variação percentual do custo.
- Qualidade = taxa de avaliação da competência, usada como trava da interpretação de eficiência.

## Comparações
- Mês anterior: competência atual contra a competência anterior disponível.
- 3/6/12 meses: competência atual contra a média das competências anteriores disponíveis dentro da janela.

## Leitura de eficiência
- Eficiência saudável: spread acima de 2 p.p. e qualidade preservada.
- Ganho com alerta: spread acima de 2 p.p. com deterioração de qualidade.
- Custo acima da produção: spread abaixo de -2 p.p.
- Estável: variações dentro da faixa intermediária.

## Segurança
A RPC `get_strategy_financial_history` retorna somente agregados de competência e escopo de Squad. Salários individuais permanecem fora da resposta executiva.

## Operacional
A migration também amplia `get_strategy_squad_cost_summary` para retornar atendimentos e taxa de avaliação agregados. Isso permite que usuários estratégicos consultem a visão executiva sem depender de acesso às telas operacionais.
