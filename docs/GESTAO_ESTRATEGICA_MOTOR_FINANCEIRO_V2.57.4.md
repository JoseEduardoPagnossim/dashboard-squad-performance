# V2.57.4 — Motor financeiro + consolidação por Squad

## Objetivo

Consolidar custos pessoais e operacionais por competência e Squad, conectando custo com volume operacional sem alterar o domínio operacional.

## Acesso

O checkbox **Acesso à Gestão Estratégica** passa a representar o acesso funcional ao MVP atual: visualização agregada, custos pessoais e edição de custos. `can_close_competence` continua separado. A migration atualiza também usuários que já estavam marcados.

## Motor

Regra `SC-0.4.0-financial`. Custos gerais podem ser rateados por FTE ou atendimentos; custos de Squad usam rateio direto. O rateio é persistido em `strategy_cost_allocations`, preservando a fotografia da competência.

## Consolidação

Por Squad: custo de pessoas, custo operacional, custo total, atendimentos, FTE, custo por atendimento e atendimentos por FTE. O total da organização sempre inclui o custo operacional integral; valores sem base de rateio aparecem como não rateados.
