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
