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

Sempre teste pelo menos estes perfis após mudanças de schema/policies:

- Admin Geral;
- Admin de Squad;
- Técnico.


## Privilegios da Data API

A partir da V2.29.9, as tabelas usadas via `supabase-js` e pelas Edge Functions possuem `GRANT`s explicitos. `GRANT` e RLS sao camadas diferentes: o primeiro permite a operacao SQL para o role; a segunda restringe as linhas acessiveis.

O projeto nao concede novos privilegios ao role `anon`. Para novas tabelas em `public`, declare o `GRANT` necessario na mesma migration do `CREATE TABLE` e revise sequences quando utilizar `identity`/`serial`.

Veja `docs/SUPABASE_DATA_API_GRANTS_2026.md`.

## Auditoria administrativa

A V2.29.8 mantém os registros administrativos em `audit_logs`. A tabela tem RLS para leitura e não concede INSERT/UPDATE/DELETE ao cliente autenticado. Registros feitos pelo frontend passam por `log_audit_event`, que deriva o ator da sessão; operações de usuários executadas pelas Edge Functions são gravadas pelo backend.

O frontend sanitiza payloads de auditoria e substitui campos com nomes sensíveis (senha, token, secret, authorization, `service_role` e API keys) por `[removido]`. Mesmo assim, não inclua secrets em objetos de negócio ou mensagens de descrição.

A exclusão de usuário/competência e a reabertura de competência possuem confirmação digitada adicional para reduzir ações acidentais. Auditoria não substitui backup do banco.

## Dados de demonstração

Os dados em `js/default-data.js` e `js/demo-users.js` são fictícios. Nomes de colaboradores foram removidos do conjunto demonstrativo e das notas históricas incluídas no repositório.

As senhas de demonstração são públicas por definição e não devem ser reutilizadas em nenhum ambiente real.

## Repositório público

Mesmo sem secrets, um repositório público expõe fórmulas, regras internas, estrutura de dados e lógica de negócio. Se essas informações forem confidenciais para a empresa, utilize um repositório privado e revise a estratégia de hospedagem do frontend.

## Antes de cada publicação

- procure por `service_role`, tokens e senhas reais;
- valide RLS e permissões;
- confirme que arquivos de exportação/importação com dados de clientes não foram adicionados ao Git;
- revise `git diff` antes do commit;
- publique frontend e migrations em etapas controladas.


## ROI do Suporte

A V2.30.0 trata custo e oportunidades como informação financeira restrita. A navegação do módulo é `super-only` e a tabela `support_roi_opportunities` possui RLS para Admin Geral da mesma organização. As alterações relevantes também são registradas em `audit_logs`.

Os modelos CSV contêm apenas exemplos fictícios. Não versione arquivos reais de clientes ou exportações de produção no repositório.
