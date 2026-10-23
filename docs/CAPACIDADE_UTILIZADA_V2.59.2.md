# V2.59.2 — Capacidade utilizada

A V2.59.2 ativa a segunda entrega da Fase 4: medir a **carga realmente absorvida pela estrutura disponível**.

## Regra

Nesta versão, capacidade utilizada não é um percentual.

A unidade principal é resolução:

- **carga utilizada** = resoluções registradas para a competência;
- **intensidade da carga** = resoluções ÷ FTE disponível.

Exemplo:

- FTE disponível: 5,00;
- resoluções: 1.000;
- capacidade utilizada observada: 1.000 resoluções;
- intensidade: 200 resoluções por FTE disponível.

Isso ainda não significa 100% de utilização. Para afirmar se 200 resoluções/FTE representam 80%, 100% ou 120% da capacidade é necessária uma referência sustentável. Essa comparação fica reservada à V2.59.3.

## Por que não calcular percentual agora

A produção realizada não é, por si só, a capacidade máxima sustentável. Usar o próprio realizado como denominador faria toda competência parecer 100% utilizada.

Por isso a V2.59.2 mede somente a carga observada e sua densidade sobre o FTE disponível.

## Cobertura e fail-closed

A carga consolidada só é calculada quando:

- a disponibilidade da competência está completa;
- existe FTE disponível maior que zero no escopo;
- todo FTE efetivamente disponível possui base explícita de resolução;
- não existe produção positiva associada a FTE disponível igual a zero.

Se alguma dessas condições falhar, o agregado permanece indisponível.

`0` resoluções informado explicitamente continua sendo dado válido. Ausência de registro de resolução não é convertida em zero.

Pessoas com disponibilidade de 0% não exigem resolução para completar a cobertura, pois não representam capacidade disponível na competência. Caso haja resolução positiva para uma pessoa com 0% disponível, a base é marcada como inconsistente.

## Visões

A tela Capacidade passa a mostrar:

- resoluções absorvidas no escopo;
- resoluções por FTE disponível;
- FTE disponível usado como denominador;
- cobertura da base de carga;
- consolidação por Squad;
- detalhamento por técnico para usuários autorizados.

## Banco de dados

Executar `supabase/migrations/MIGRACAO_V2.59.2.sql` depois da V2.59.1.

A migration cria somente RPCs agregadas:

- `get_strategy_capacity_used_summary(date,text)`;
- `get_strategy_capacity_used_squad_summary(date)`.

Ela não cria tabela nova e não altera salários, custos, FTE ou disponibilidade.

## Fora do escopo

A V2.59.2 ainda não calcula:

- taxa percentual de utilização;
- ociosidade;
- sobrecarga;
- capacidade sustentável;
- FTE necessário;
- gap de capacidade.

Esses itens permanecem nas versões seguintes da Fase 4.
