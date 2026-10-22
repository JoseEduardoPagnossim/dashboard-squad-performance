## V2.57.5 — Resultado Executivo

A Gestão Estratégica passa a transformar o motor financeiro da V2.57.4 em uma visão de Diretoria, cruzando custo, produção e qualidade sem alterar o operacional.

### Principais entregas
- cards executivos de custo total, pessoas, operação, custo por atendimento, produção, FTE, produtividade e avaliação;
- comparação contra mês anterior ou média das 3/6/12 competências anteriores;
- spread de eficiência: variação da produção menos variação do custo;
- trava de qualidade para evitar leitura positiva de produtividade com deterioração relevante da avaliação;
- evolução do custo por atendimento;
- gráfico Custo x Produção em índice base 100;
- composição do custo entre Pessoas e Operação;
- comparativo executivo por Squad;
- insights determinísticos e explicáveis;
- RPC estratégica agregada de histórico, sem expor salários individuais.

### Banco
Execute `supabase/migrations/MIGRACAO_V2.57.5.sql` após as migrações anteriores da série 2.57.x.

Detalhes: `docs/GESTAO_ESTRATEGICA_RESULTADO_EXECUTIVO_V2.57.5.md`.
