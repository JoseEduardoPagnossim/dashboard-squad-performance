# V2.48.8 — Exceções de desconto e tela compacta de bonificação

## Regra de férias

O redutor de férias continua incidindo somente sobre a comissão-base após o multiplicador de cancelamento:

```text
base após cancelamento × 50%
```

A partir desta versão, um técnico marcado como **Férias no mês • pagar 50% da base** também fica automaticamente isento do desconto financeiro por status `ABAIXO`.

Essa isenção não retira o técnico da quantidade usada pela Base do Squad e não bloqueia uma eventual redistribuição caso o status financeiro esteja `ACIMA`.

## Exceção manual do desconto ABAIXO

Cada técnico passa a ter o checkbox **Isentar desconto ABAIXO**.

Quando marcado:

- o técnico continua normalmente no divisor da Base do Squad;
- seus atendimentos e avaliações continuam nos totais;
- status, pontuação e ranking continuam normais;
- se ficar `ABAIXO`, não recebe o desconto configurado (R$ 200,00 na regra atual);
- esse valor também não entra no pool de redistribuição;
- se ficar `ACIMA`, continua elegível a receber redistribuição.

A opção é independente de **Fora da quantidade do Squad**, que continua sendo reservada à competência parcial e exclui o técnico do divisor financeiro e dos ajustes.

## Persistência e fechamento

A opção é gravada em `technician_finance_monthly.waive_below_discount` por técnico e competência. Reimportações do mesmo mês preservam a escolha. Ao fechar a competência, a flag e o cálculo ficam congelados no snapshot.

## Tela de bonificação

A listagem de técnicos foi reorganizada em formato compacto de grade/tabela:

- uma linha superior resume técnico, status, produtividade, qualidade, Base Squad, Individual e valor oficial;
- a linha de edição concentra atendimentos sem avaliação, bônus, vendas e os três controles financeiros;
- detalhes e memória de cálculo continuam recolhíveis abaixo da linha;
- em resoluções menores a grade quebra em 4, 2 ou 1 coluna, sem rolagem horizontal global.

A alteração visual é escopada ao módulo `.admin-finance` e não modifica a sidebar, a topbar nem os componentes das demais telas.

## Banco de dados

Execute `MIGRACAO_V2.48.8.sql` antes de publicar o frontend.
