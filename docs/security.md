# Segurança

## Chaves do Supabase

`js/config.js` é enviado ao navegador e, portanto, seu conteúdo deve ser considerado público.

É aceitável usar nele apenas a chave **publishable/anon** do Supabase. Nunca coloque no frontend:

- `service_role`;
- secrets de Edge Functions;
- senhas administrativas;
- tokens privados de integrações.

## RLS é obrigatória

A chave pública não substitui controle de acesso. A proteção dos dados depende das policies de Row Level Security e das regras de autorização definidas no banco.

A partir da V2.43.2 existem somente dois perfis ativos na aplicação:

- **Administrador (`super_admin`)** — acesso completo à organização e a todos os Squads;
- **Técnico (`technician`)** — acesso limitado ao próprio escopo e às funções permitidas pelo perfil.

O papel histórico `squad_admin` não aparece mais na aplicação. A migration V2.43.2 converte registros existentes para `super_admin`. O valor pode permanecer aceito pelo schema apenas por compatibilidade histórica.

Sempre teste pelo menos um Administrador e um Técnico após mudanças de schema/policies.

## Privilégios da Data API

A partir da V2.29.9, as tabelas usadas via `supabase-js` e pelas Edge Functions possuem `GRANT`s explícitos. `GRANT` e RLS são camadas diferentes: o primeiro permite a operação SQL para o role; a segunda restringe as linhas acessíveis.

O projeto não concede novos privilégios ao role `anon`. Para novas tabelas em `public`, declare o `GRANT` necessário na mesma migration do `CREATE TABLE` e revise sequences quando utilizar `identity`/`serial`.

Veja `docs/SUPABASE_DATA_API_GRANTS_2026.md`.

## Administração e permissões

Administradores sempre possuem o conjunto administrativo completo. A coluna `profiles.permissions` é mantida para compatibilidade e para restrições adicionais do Técnico, mas um override individual não pode reduzir acesso de `super_admin`.

As Edge Functions `create-user` e `manage-user` aceitam somente `super_admin` e `technician` como perfis de destino. Operações administrativas continuam no backend com `service_role` e validação da sessão solicitante.

## Auditoria administrativa

A V2.29.8 mantém os registros administrativos em `audit_logs`. A tabela tem RLS para leitura e não concede INSERT/UPDATE/DELETE ao cliente autenticado. Registros feitos pelo frontend passam por `log_audit_event`, que deriva o ator da sessão; operações de usuários executadas pelas Edge Functions são gravadas pelo backend.

O frontend sanitiza payloads de auditoria e substitui campos com nomes sensíveis por `[removido]`. Mesmo assim, não inclua secrets em objetos de negócio ou mensagens de descrição.

A exclusão de usuário/competência e a reabertura de competência possuem confirmação digitada adicional. Auditoria não substitui backup do banco.

## Dados de demonstração

Os dados em `js/default-data.js` e `js/demo-users.js` são fictícios. As senhas de demonstração são públicas por definição e não devem ser reutilizadas em nenhum ambiente real.

## Repositório público

Mesmo sem secrets, um repositório público expõe fórmulas, regras internas, estrutura de dados e lógica de negócio. Se essas informações forem confidenciais para a empresa, utilize um repositório privado e revise a estratégia de hospedagem do frontend.

## Antes de cada publicação

- procure por `service_role`, tokens e senhas reais;
- valide RLS e permissões com Administrador e Técnico;
- confirme que arquivos de exportação/importação com dados de clientes não foram adicionados ao Git;
- revise `git diff` antes do commit;
- publique migrations, Edge Functions e frontend em etapas controladas.
## V2.57.1 — Autorização estratégica separada

A Gestão Estratégica não usa `super_admin` como sinônimo de acesso irrestrito a informação financeira. A tabela `strategy_access` define capacidades específicas. Cada usuário autenticado pode ler somente o próprio registro; quem possui `can_manage_access` pode administrar registros da mesma organização.

O bootstrap da migration libera aos administradores existentes apenas a fundação, agregados e gestão de acesso. `can_view_people_costs`, `can_edit_costs` e `can_close_competence` permanecem desabilitados. Essa separação deve ser preservada quando custos pessoais forem adicionados na V2.57.1: telas agregadas não devem baixar salários individuais desnecessariamente.


## V2.57.2 — Separação entre agregado e salário individual

O acesso geral à Gestão Estratégica não concede acesso a salários. As tabelas `strategy_people` e `strategy_employee_costs` exigem `can_view_people_costs`; escrita exige também `can_edit_costs`. Usuários com acesso apenas agregado recebem totais por uma RPC `SECURITY DEFINER` que valida `has_strategy_access('aggregates')` e não retorna nomes ou linhas individuais.


## V2.57.4 — Checkbox funcional do MVP

Somente Super Admin altera o checkbox. Quando marcado, ele habilita `can_view_strategy`, `can_view_aggregates`, `can_view_people_costs` e `can_edit_costs`. Fechamento de competência permanece separado.
