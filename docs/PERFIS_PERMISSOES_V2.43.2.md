# V2.43.2 — Perfis e permissões simplificados

A V2.43.2 alinha o controle de acesso do Soften Performance Hub ao uso real da operação: existem apenas dois perfis ativos na aplicação.

## Perfis ativos

### Administrador (`super_admin`)

- acesso completo a todos os Squads A, B, D e E;
- acesso a todos os módulos administrativos;
- pode importar dados, alterar metas, fechar/reabrir competências, gerenciar bonificação, custos, usuários, auditoria, aparência, TV e configurações;
- não possui vínculo fixo com um Squad;
- não pode ser limitado por overrides individuais de permissões.

### Técnico (`technician`)

- acesso às áreas operacionais permitidas ao técnico;
- vínculo com Squad e nome utilizado nas importações;
- pode receber restrições adicionais de acesso quando a função já fizer parte do perfil-base;
- uma restrição nunca pode elevar o técnico a uma função administrativa.

## O que aconteceu com `squad_admin`

`Admin de Squad` deixou de ser um perfil ativo da aplicação.

A migration `MIGRACAO_V2.43.2.sql` converte qualquer registro legado com `role = 'squad_admin'` para `super_admin`, remove o vínculo fixo de Squad e limpa restrições individuais do administrador.

O valor legado pode continuar aceito pelo schema histórico para evitar uma alteração destrutiva de enum/check constraint e manter compatibilidade com migrations antigas. Porém:

- não aparece na interface;
- não pode ser criado pelas Edge Functions atuais;
- não recebe privilégios administrativos pelas regras atuais;
- ao ser lido pelo frontend é normalizado para `super_admin` por compatibilidade.

## Permissões específicas

A estrutura de `permissions` é mantida porque continua útil para Técnicos e preserva compatibilidade com a V2.38.

A regra efetiva passa a ser:

```text
Administrador = acesso administrativo completo
Técnico       = permissões do perfil-base - restrições específicas
```

Um valor `false` salvo por engano em `permissions` não reduz o acesso de um Administrador.

## Banco e RLS

A função `public.can_admin_squad(uuid)` mantém o nome histórico para não exigir reescrita de todas as policies, mas a partir desta versão retorna acesso administrativo somente quando o usuário ativo da organização possui `role = 'super_admin'`.

## Edge Functions

`create-user` e `manage-user` passam a aceitar como destino apenas:

- `super_admin`;
- `technician`.

As funções também tratam qualquer requester legado `squad_admin` como Administrador durante a transição, mas não criam novos usuários nesse papel.

## Publicação

Ordem recomendada:

1. executar `supabase/migrations/MIGRACAO_V2.43.2.sql`;
2. republicar as Edge Functions `create-user` e `manage-user`;
3. publicar o frontend V2.43.2;
4. validar login dos quatro Administradores e de pelo menos um Técnico;
5. confirmar que Administradores enxergam todos os Squads e que Técnicos continuam restritos ao próprio escopo.

Nenhuma regra de metas, importação, bonificação, financeiro, TV ou performance foi alterada nesta versão.
