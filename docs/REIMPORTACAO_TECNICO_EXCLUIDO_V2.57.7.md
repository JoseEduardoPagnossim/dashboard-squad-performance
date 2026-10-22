# V2.57.7 — Reimportação de técnico excluído

## Objetivo

Preservar a produção real registrada no CRM sem permitir que um técnico excluído ou inativo volte a ser tratado como usuário atual do dashboard.

## Regra de identidade

- técnico ativo: o CSV pode resolver e persistir o `user_id`;
- técnico histórico sem usuário ativo: o nome/alias pode ser reconhecido, mas o registro é persistido com `user_id = null`;
- nome desconhecido ou ambíguo: continua sinalizado na prévia de importação.

## Efeito nas métricas

O registro histórico sem usuário ativo continua participando de:

- atendimentos do Squad;
- avaliações e notas do Squad;
- consolidados operacionais gerais.

Ele deixa de participar, em competência aberta, de:

- headcount;
- ranking individual;
- pontuação/status individual;
- bonificação individual e redistribuições dependentes de pessoas ativas;
- seleção de técnico e análises individuais.

## Reimportação

A importação operacional recarrega o diretório atual de usuários antes de resolver os nomes. Na persistência, cada `user_id` é revalidado contra `profiles` com `role = technician` e `active = true`. Um vínculo antigo inválido é substituído por `null`.

A migration também saneia imediatamente vínculos inválidos já existentes em competências abertas. Competências fechadas não são alteradas automaticamente; reabra a competência antes de reimportar caso precise corrigi-la.

## Proteção no banco

`MIGRACAO_V2.57.7.sql` instala o trigger `technician_monthly_guard_active_user`. Mesmo que um estado antigo do navegador tente gravar um UUID obsoleto, o banco converte o vínculo para `null` quando o usuário não for um técnico ativo da mesma organização.

## Ranking por período

A produção total continua usando todas as linhas da competência. As listas/rankings individuais usam apenas técnicos vinculados em competências abertas. O RPC `get_my_squad_game_ranking` segue a mesma regra.
