# V2.60.2 — Receita Influenciada

## Objetivo
Medir oportunidades em que Suporte/Onboarding participou da geração, qualificação ou evolução da receita sem atribuir ao time o fechamento integral da venda.

## Regra econômica
- evento `influenced` em `draft`: oportunidade em andamento; o valor é pipeline potencial, não receita;
- evento `influenced` em `confirmed`: oportunidade convertida; `gross_amount` entra em Receita Influenciada;
- evento `cancelled`: permanece auditável e não compõe receita;
- Receita Influenciada é exibida separadamente da Receita Direta;
- a mesma `source_reference` não pode representar dois eventos econômicos diferentes.

## Etapas nativas
- `originated` — originou oportunidade;
- `qualified` — qualificou necessidade;
- `evolved` — evoluiu oportunidade;
- `negotiation_support` — apoiou negociação;
- `handoff` — encaminhou oportunidade;
- `other` — outra influência comprovada.

## Indicadores
- Receita Influenciada convertida;
- oportunidades totais;
- em andamento;
- convertidas;
- encerradas sem conversão;
- taxa de conversão das oportunidades encerradas;
- pipeline influenciado aberto;
- novo MRR/ARR convertido;
- composição por etapa de influência.

## Integridade
O filtro de Squad usa `EXISTS` nas atribuições, evitando duplicar o evento quando houver mais de um participante. A etapa de influência descreve participação e não cria percentual automático de crédito.
