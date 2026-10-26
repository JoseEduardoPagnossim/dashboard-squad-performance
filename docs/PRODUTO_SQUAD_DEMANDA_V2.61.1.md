# V2.61.1 — Demanda por Produto

## Objetivo

Ativar a primeira leitura operacional da Fase 6, medindo por Produto:

- Atendimentos;
- participação na demanda;
- Clientes atendidos;
- Chamados;
- Resoluções.

A V2.61.1 usa a Fundação Produto/Squad da V2.61.0 e mantém toda parcela sem Produto como **Não classificado**.

## Fontes oficiais

### Atendimentos

`sync_strategy_product_demand_sources()` sincroniza a produção oficial de `technician_monthly.att`, consolidada por Squad e competência, para `strategy_product_sources` com:

- `source_domain = 'attendance'`;
- `metric_key = 'attendance'`;
- referência estável `operational_attendance:<SQUAD>`.

O upsert preserva o identificador da fonte e, portanto, preserva as atribuições de Produto existentes.

### Resoluções

A mesma sincronização usa `strategy_resolution_metrics`, já consolidada pela Fase 3/4, com:

- `source_domain = 'resolution'`;
- `metric_key = 'resolution'`;
- referência estável `strategy_resolution:<SQUAD>`.

Resolução não é inferida de Atendimento.

### Clientes atendidos

Cliente único é uma métrica própria. A V2.61.1 **não infere clientes a partir de atendimentos**.

Uma integração que forneça clientes únicos deve registrar fontes de demanda com:

- `source_domain = 'attendance'`;
- `metric_key = 'client'`;
- `source_quantity` igual à contagem já deduplicada no escopo da fonte.

Fontes de clientes que se sobreponham não devem ser somadas, porque isso produziria dupla contagem.

### Chamados

Chamado também é uma métrica independente. A V2.61.1 não considera `1 atendimento = 1 chamado`.

Uma fonte explícita de chamados deve usar:

- `source_domain = 'attendance'`;
- `metric_key = 'ticket'`;
- `source_quantity` com a quantidade oficial de chamados no escopo.

## Participação na demanda

A participação do Produto é calculada somente sobre **Atendimentos**:

`Participação = Atendimentos atribuídos ao Produto / Atendimentos totais do escopo`

O denominador inclui o saldo **Não classificado**, impedindo que uma baixa cobertura de Produto aumente artificialmente a participação dos produtos já classificados.

Clientes, Chamados e Resoluções não entram no mesmo denominador e não são somados entre si.

## Atribuição e Não classificado

Cada fonte usa `strategy_product_attributions.allocation_share`.

Exemplo:

- Atendimentos do Squad D: 1.000;
- Produto A: 60%;
- Produto B: 25%;
- saldo: 15%.

Resultado:

- Produto A: 600 atendimentos;
- Produto B: 250 atendimentos;
- Não classificado: 150 atendimentos.

A soma continua reconciliando com 1.000.

## Filtro de Squad

A RPC `get_strategy_product_demand_summary()` filtra as fontes pelo `squad_code_snapshot`. O rateio por Produto permanece o registrado na fonte e não é redistribuído quando o usuário troca o filtro.

## Interface

A aba Produto/Squad passa a exibir:

- total de Atendimentos;
- percentual do volume classificado;
- Clientes atendidos, quando houver fonte;
- Chamados, quando houver fonte;
- Resoluções, quando houver fonte;
- tabela Produto × métricas de demanda;
- linha explícita `Não classificado`;
- botão **Sincronizar demanda** para usuários com permissão de edição.

O botão sincroniza somente Atendimentos e Resoluções, porque são as duas fontes oficiais disponíveis no dashboard nesta etapa.

## Segurança e competência fechada

- leitura agregada exige `has_strategy_access('aggregates')`;
- sincronização exige `has_strategy_access('edit_costs')`;
- competência fechada não pode ser sincronizada;
- fontes e atribuições continuam protegidas pelas RLS/triggers da V2.61.0.

## Próxima versão

A V2.61.2 usará a mesma dimensão Produto para calcular **Custo por Produto**, sem duplicar a fonte financeira da Fase 3.
