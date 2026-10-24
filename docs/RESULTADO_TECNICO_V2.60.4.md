# V2.60.4 — Resultado por técnico

## Objetivo
Mostrar a contribuição econômica individual de cada técnico sem transformar Receita Direta, Influenciada e Protegida em um único total artificial.

## Regra de atribuição
- `attribution_share` explícita tem precedência.
- Shares explícitos do mesmo evento não podem ultrapassar 100%.
- O saldo restante é dividido igualmente entre participantes sem share explícito.
- Quando todos estão sem share, o evento é dividido igualmente.
- O filtro de Squad é aplicado depois do cálculo do share do evento inteiro, evitando redistribuição retroativa ao trocar o filtro.

## Leitura individual
Cada técnico recebe colunas independentes para:
- Receita Direta e novo MRR/ARR direto;
- Receita Influenciada e recorrência influenciada;
- Receita Protegida e MRR/ARR protegido;
- participações e eventos com crédito econômico.

Não existe `resultado total` por técnico nesta versão. ROI, custo e retorno operacional ficam reservados para a V2.60.6.

## Segurança
A RPC `get_strategy_result_technician_summary` exige `people_costs`, porque expõe detalhamento individual. Usuários com acesso apenas agregado continuam vendo as três naturezas no nível consolidado, sem nomes de técnicos.

## Banco
Executar `MIGRACAO_V2.60.4.sql` após `MIGRACAO_V2.60.3.sql`.
