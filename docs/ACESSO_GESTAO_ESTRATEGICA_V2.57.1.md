# V2.57.1 — Acesso à Gestão Estratégica por usuário

## Objetivo

Tornar a liberação da Gestão Estratégica explícita e administrável no próprio Controle de Usuários, sem transformar o perfil `super_admin` em permissão financeira implícita.

## Interface

A listagem de usuários recebe a coluna **Gestão Estratégica** com checkbox individual. O checkbox nasce desmarcado quando não existe autorização explícita. Somente Super Admin pode alterá-lo.

Ao marcar, o usuário recebe somente:

- `can_view_strategy = true`;
- `can_view_aggregates = true`.

As capacidades sensíveis continuam `false`:

- `can_view_people_costs`;
- `can_edit_costs`;
- `can_close_competence`;
- `can_manage_access`.

Ao desmarcar, todas as capacidades estratégicas são zeradas.

## Segurança

A migration `MIGRACAO_V2.57.1.sql` troca as policies de `strategy_access` para permitir administração exclusivamente por `public.is_super_admin()`. O próprio usuário ainda pode consultar o seu registro para que o frontend saiba se deve exibir a área.

O Super Admin consegue administrar o checkbox mesmo quando o próprio acesso estratégico está desmarcado.

## Compatibilidade com a V2.57.0

A V2.57.0 havia criado um bootstrap automático para Super Admins. A V2.57.1 revoga somente registros que ainda possuem exatamente esse padrão automático, tornando o modelo opt-in sem apagar autorizações financeiras futuras.

## Fora do escopo

Esta versão não cria folha, salário, encargos, benefícios, custos operacionais, competências financeiras ou rateios. Esses dados permanecem reservados para a próxima etapa do MVP.
