# V2.60.0 — Fundação de Resultado

## Objetivo
Abrir a Fase 5 com um domínio econômico isolado, auditável e preparado para medir receita direta, influenciada e protegida sem misturar conceitos ou duplicar eventos.

## Regra central
As três naturezas são independentes:

- **Receita direta:** receita comprovadamente atribuída à atuação do time.
- **Receita influenciada:** receita em que o time participou da origem, qualificação ou evolução, sem receber atribuição integral.
- **Receita protegida:** receita existente preservada por retenção, recuperação ou prevenção de cancelamento.

A V2.60.0 não soma essas naturezas e não publica ainda valores monetários consolidados.

## Estrutura de dados
A fundação separa:

1. `strategy_result_events`: o evento econômico único.
2. `strategy_result_attributions`: participantes e Squads ligados ao evento.

Isso permite que uma venda/retenção tenha vários participantes sem multiplicar o valor econômico.

## Filtros
A nova área herda o contexto estratégico já estabilizado:

- competência;
- Squad/grupo;
- comparação histórica.

Filtros operacionais do dashboard continuam isolados da Gestão Estratégica.

## Estados do evento
- `draft`: em validação;
- `confirmed`: confirmado e apto a compor métricas futuras;
- `cancelled`: cancelado/estornado, mantido para auditoria e excluído das métricas econômicas futuras.

## Auditoria e deduplicação
- `source` identifica origem (`manual`, `csv`, `api`, `crm`);
- `source_reference` impede duplicidade da mesma origem quando preenchida;
- evento e atribuição são separados;
- guards de banco impedem vínculo entre competência, evento, pessoa e organização incompatíveis;
- a classificação é explícita e nunca inferida silenciosamente.

## Motor
Motor base: `RE-0.1.0-result-foundation`.

Ele normaliza escopo, tipos, estados e prontidão da base. Os cálculos monetários entram a partir da V2.60.1.
