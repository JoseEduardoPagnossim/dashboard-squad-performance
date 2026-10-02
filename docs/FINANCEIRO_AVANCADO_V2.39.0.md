# V2.39.0 — Financeiro avançado

## Objetivo

A versão transforma a bonificação em um processo auditável sem alterar a fórmula oficial vigente. Ela adiciona quatro camadas: memória de cálculo, simulador, versão/assinatura das regras e explicação completa do valor.

## Versão da regra e assinatura

- **Versão da regra:** identifica a lógica do motor financeiro. Nesta release: `FR-2.39.0-1`.
- **Assinatura da configuração:** fingerprint determinístico das faixas, prêmios, desconto, dados de cancelamento, modelo oficial e teto Individual. Se algum desses parâmetros mudar, a assinatura muda mesmo que a versão do motor continue igual.

Essa separação permite distinguir uma mudança de código de uma mudança administrativa de parâmetros.

## Memória de cálculo

A aplicação registra uma fotografia após eventos relevantes:

- salvamento das regras/configuração;
- salvamento dos ajustes individuais;
- cópia de regras da competência anterior;
- fechamento da competência;
- registro manual solicitado pelo gestor.

Cada memória contém regra, assinatura, modelo oficial, parâmetros do mês, configurações financeiras, valores calculados por técnico e total da folha. Com a migration V2.39.0, os registros ficam na tabela `finance_calculation_memory`, que permite apenas leitura e inserção para administradores autorizados; update/delete não são concedidos.

Sem a migration, o sistema mantém fallback em `localStorage`. Esse fallback é útil para continuidade, mas não substitui a memória centralizada entre navegadores/gestores.

## Simulador

O simulador parte de uma cópia da competência e permite alterar, para análise, técnico, modelo, atendimentos, Notas 5, atendimentos sem avaliação, bônus, vendas, clientes, cancelamentos, teto, férias e participação no divisor do Squad.

A simulação executa novamente o pipeline financeiro completo, portanto pode alterar indiretamente a Base do Squad, status, prêmios, desconto/redistribuição e teto. Nenhuma informação simulada é gravada no Supabase nem substitui o valor oficial.

## Explicação do cálculo

O detalhamento segue a ordem do cálculo oficial:

1. comissão por atendimento;
2. comissão por Notas 5;
3. multiplicador de cancelamento;
4. férias, quando aplicável, reduzindo 50% **somente da comissão-base após cancelamento**;
5. bônus e prêmios;
6. comissão de vendas;
7. desconto por desempenho;
8. redistribuição;
9. piso zero e teto proporcional, quando o modelo Individual exigir;
10. bonificação final.

O detalhamento exibe também versão e assinatura da regra.

## Fechamento

Ao fechar uma competência, `closed_snapshot` congela a versão e a assinatura das regras junto dos dados financeiros. A memória de cálculo de fechamento é registrada depois do congelamento. Competências históricas anteriores à V2.39 que não possuam versão explícita são identificadas como legado.

## Relatórios

O Excel passa a levar versão e assinatura tanto na planilha de técnicos quanto no resumo. O PDF mostra a identificação da regra no cabeçalho.

## Banco de dados

Aplicar em produção:

```sql
supabase/migrations/MIGRACAO_V2.39.0.sql
```

A migration cria `public.finance_calculation_memory`, índices, RLS e grants de `SELECT/INSERT`, mantendo a memória imutável após a criação.
