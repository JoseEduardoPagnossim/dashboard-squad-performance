# V2.59.4 — Produtividade por FTE

A V2.59.4 normaliza a produção pela força de trabalho efetivamente disponível, permitindo comparar estruturas de tamanhos diferentes sem usar volume bruto ou quantidade de pessoas como proxy de produtividade.

## Métrica principal

`produtividade por FTE = resoluções / FTE disponível`

O FTE disponível vem da V2.59.1 (`FTE nominal × disponibilidade da competência`). A resolução continua sendo a fonte explícita criada na Fase 3.

Também são exibidos:

- `atendimentos / FTE disponível`;
- `taxa de resolução = resoluções / atendimentos`;
- índice relativo de produtividade.

## Índice relativo

A operação completa da competência vale 100:

`índice vs operação = produtividade do escopo / produtividade da operação × 100`

O índice é referência relativa da competência, não meta, SLA ou classificação automática. A V2.59.3 continua responsável por ociosidade/sobrecarga contra histórico sustentável.

Para técnicos, a tela também mostra índice contra a produtividade do próprio Squad e contra a operação completa.

## Fail-closed

A produtividade principal só é calculada quando o FTE e a disponibilidade estão completos, existe FTE disponível maior que zero, todo FTE disponível do agregado possui resolução explícita e não há produção positiva associada a disponibilidade zero.

Atendimentos/FTE são independentes: se a base de atendimento estiver incompleta, esse indicador fica indisponível sem invalidar uma produtividade por resolução que esteja completa.

`0` resolução explicitamente informada continua válido. Ausência de registro não vira zero.

## Relação com versões anteriores

- V2.59.1 fornece o FTE disponível;
- V2.59.2 mede carga absorvida;
- V2.59.3 compara a carga com histórico sustentável;
- V2.59.4 normaliza produtividade pela força disponível.

A V2.59.5 continua responsável por FTE necessário.

## Banco de dados

A V2.59.4 não cria migration. Ela reutiliza as bases e RPCs das V2.59.1 a V2.59.3 e os dados operacionais já carregados pelo painel.
