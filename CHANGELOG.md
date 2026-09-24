# Changelog

Histórico resumido do Soften Performance Hub. As notas completas de cada versão permanecem em `docs/releases/`.

## 2.29.9

- compatibilidade com a mudança de exposição automática da Data API do Supabase prevista para 30/10/2026;
- nova migration `MIGRACAO_V2.29.9.sql` com `GRANT`s explícitos para frontend autenticado e Edge Functions;
- nenhuma nova permissão para o role `anon`;
- `schema.sql` cumulativo atualizado para novas instalações;
- documentação e Quality Gate reforçados para futuras tabelas.

## 2.29.8

- nova área **Gestão > Auditoria** com leitura por escopo e RLS;
- registro de alterações administrativas com ator, data/hora, descrição e visão antes/depois;
- auditoria de usuários realizada pelas Edge Functions `create-user` e `manage-user`;
- auditoria de importações, competências, metas, regras/valores financeiros, custos e impacto financeiro;
- confirmação digitada para exclusões e reabertura de competência;
- sanitização de campos sensíveis nos payloads de auditoria;
- novos testes automáticos para confirmação crítica e sanitização;
- nova migração `MIGRACAO_V2.29.8.sql` e atualização do instalador cumulativo.

## 2.29.7

- extração das regras financeiras críticas para `js/finance-rules.js`;
- inclusão de testes automáticos com Node.js para faixas, cancelamento, status, prêmios, redistribuição, férias, piso zero e teto global;
- inclusão do GitHub Actions `Quality Gate` em pushes e Pull Requests da `main`;
- validação estrutural reforçada para garantir o carregamento correto do módulo financeiro;
- nenhuma migração de banco de dados necessária.

## 2.29.6

- consolidação das regras de status e bonificação;
- ajuste de arredondamento da nota média;
- separação definitiva entre status operacional e exclusão financeira de competência parcial;
- alinhamento do ranking/RPC com a visão administrativa.

## 2.29.5

- inclusão de atendimentos não elegíveis à avaliação;
- ajuste da base de cálculo da % de avaliação e da bonificação.

## 2.29.0–2.29.4

- impacto financeiro da qualidade;
- leitura estratégica de risco;
- consistência de referências/status;
- importação operacional mais robusta;
- status da equipe derivado dos status individuais.

## 2.28.x

- indicadores de férias e legibilidade;
- base de custos gerais do Suporte.

## 2.27.x

- conciliação Serviço x Produto x Empresa;
- indicadores por dias úteis;
- detalhamento e correções do histórico diário.

## 2.26.x

- indicadores de qualidade e importação independente de Produto/Empresa.

## Notas completas

- [2.29.9 — Compatibilidade Data API do Supabase](docs/releases/ATUALIZACAO_V2.29.9.md)
- [2.29.8 — Auditoria e proteção de operações críticas](docs/releases/ATUALIZACAO_V2.29.8.md)
- [2.29.7 — Qualidade automatizada e testes financeiros](docs/releases/ATUALIZACAO_V2.29.7.md)
- [2.29.6 — Soften Performance Hub V2.29.6](docs/releases/ATUALIZACAO_V2.29.6.md)
- [2.29.5 — Soften Performance Hub V2.29.5](docs/releases/ATUALIZACAO_V2.29.5.md)
- [2.29.4 — Atualização V2.29.4 — Status da equipe consistente](docs/releases/ATUALIZACAO_V2.29.4.md)
- [2.29.3 — Atualização V2.29.3 — Importação operacional mais robusta](docs/releases/ATUALIZACAO_V2.29.3.md)
- [2.29.2 — Atualização V2.29.2 — Consistência de status e referências](docs/releases/ATUALIZACAO_V2.29.2.md)
- [2.29.1 — Atualização V2.29.1 — Leitura estratégica do impacto financeiro](docs/releases/ATUALIZACAO_V2.29.1.md)
- [2.29.0 — V2.29.0 — Impacto financeiro da qualidade](docs/releases/ATUALIZACAO_V2.29.0.md)
- [2.28.1 — V2.28.1 — Custo geral do Suporte](docs/releases/ATUALIZACAO_V2.28.1.md)
- [2.28.0 — Soften Performance Hub V2.28.0](docs/releases/ATUALIZACAO_V2.28.0.md)
- [2.27.4 — Soften Performance Hub V2.27.4](docs/releases/ATUALIZACAO_V2.27.4.md)
- [2.27.2 — Soften Performance Hub V2.27.2](docs/releases/ATUALIZACAO_V2.27.2.md)
- [2.27.1 — Soften Performance Hub V2.27.1](docs/releases/ATUALIZACAO_V2.27.1.md)
- [2.27.0 — Soften Performance Hub V2.27.0](docs/releases/ATUALIZACAO_V2.27.0.md)
- [2.26.1 — ATUALIZAÇÃO V2.26.1](docs/releases/ATUALIZACAO_V2.26.1.md)
- [2.26.0 — Soften Performance Hub V2.26.0](docs/releases/ATUALIZACAO_V2.26.0.md)
- [2.25.0 — Soften Performance Hub V2.25.0](docs/releases/ATUALIZACAO_V2.25.0.md)
- [2.24.3 — Atualização V2.24.3](docs/releases/ATUALIZACAO_V2.24.3.md)
- [2.24.2 — Atualização V2.24.2](docs/releases/ATUALIZACAO_V2.24.2.md)
- [2.24.1 — Atualização V2.24.1 — Meu Desempenho](docs/releases/ATUALIZACAO_V2.24.1.md)
- [2.24.0 — Atualização V2.24.0 — Light & Dark Mode Premium](docs/releases/ATUALIZACAO_V2.24.0.md)
- [2.23.3 — Atualização V2.23.3](docs/releases/ATUALIZACAO_V2.23.3.md)
- [2.23.2 — Soften Performance Hub V2.23.2](docs/releases/ATUALIZACAO_V2.23.2.md)
- [2.23.1 — Soften Performance Hub V2.23.1](docs/releases/ATUALIZACAO_V2.23.1.md)
- [2.23.0 — Atualização V2.23.0 — Gráficos e Métricas Premium](docs/releases/ATUALIZACAO_V2.23.0.md)
- [2.22.0 — Atualização V2.22.0 — Interface premium](docs/releases/ATUALIZACAO_V2.22.0.md)
- [2.21.0 — Soften Performance Hub V2.21.0](docs/releases/ATUALIZACAO_V2.21.0.md)
- [2.20.5 — Atualização V2.20.5](docs/releases/ATUALIZACAO_V2.20.5.md)
- [2.20.4 — Atualização V2.20.4](docs/releases/ATUALIZACAO_V2.20.4.md)
- [2.20.3 — Atualização V2.20.3](docs/releases/ATUALIZACAO_V2.20.3.md)
- [2.20.2 — Atualização V2.20.2](docs/releases/ATUALIZACAO_V2.20.2.md)
- [2.20.1 — Atualização V2.20.1](docs/releases/ATUALIZACAO_V2.20.1.md)
- [2.20.0 — Atualização V2.20.0](docs/releases/ATUALIZACAO_V2.20.0.md)
- [2.19.1 — Atualização V2.19.1](docs/releases/ATUALIZACAO_V2.19.1.md)
- [2.19.0 — Atualização V2.19.0 — checklist de produção](docs/releases/ATUALIZACAO_V2.19.0.md)
- [2.18.1 — Soften Performance Hub V2.18.1](docs/releases/ATUALIZACAO_V2.18.1.md)
- [2.18.0 — Atualização V2.18.0](docs/releases/ATUALIZACAO_V2.18.0.md)
- [2.17.1 — Atualização V2.17.1 — correção da trilha ambiente](docs/releases/ATUALIZACAO_V2.17.1.md)
- [2.17.0 — Atualização V2.17.0 — trilha ambiente por tema](docs/releases/ATUALIZACAO_V2.17.0.md)
- [2.16.0 — Atualização V2.16.0](docs/releases/ATUALIZACAO_V2.16.0.md)
- [2.15.0 — Atualização V2.15.0](docs/releases/ATUALIZACAO_V2.15.0.md)
- [2.14.1 — Atualização V2.14.1](docs/releases/ATUALIZACAO_V2.14.1.md)
- [2.14.0 — Atualização V2.14.0](docs/releases/ATUALIZACAO_V2.14.0.md)
- [2.13.0 — Atualização V2.13.0](docs/releases/ATUALIZACAO_V2.13.0.md)
- [2.12.0 — Atualização V2.12.0](docs/releases/ATUALIZACAO_V2.12.0.md)
- [2.11.0 — Atualização V2.11.0](docs/releases/ATUALIZACAO_V2.11.0.md)
- [2.10.1 — Atualização V2.10.1](docs/releases/ATUALIZACAO_V2.10.1.md)
- [2.10.0 — Atualização V2.10.0](docs/releases/ATUALIZACAO_V2.10.0.md)
- [2.9.0 — Atualização V2.9.0](docs/releases/ATUALIZACAO_V2.9.0.md)
- [2.8.0 — Atualização V2.8.0](docs/releases/ATUALIZACAO_V2.8.0.md)
- [2.7.0 — Atualização V2.7.0](docs/releases/ATUALIZACAO_V2.7.0.md)
- [2.6.0 — Atualização para V2.6.0](docs/releases/ATUALIZACAO_V2.6.0.md)
- [2.5.0 — Atualização V2.5.0](docs/releases/ATUALIZACAO_V2.5.0.md)
- [2.4.0 — Atualização V2.3.0 → V2.4.0](docs/releases/ATUALIZACAO_V2.4.0.md)
- [2.3.0 — Atualização V2.2.x → V2.3.0](docs/releases/ATUALIZACAO_V2.3.0.md)
- [2.2.0 — Atualização V2.1.1 -> V2.2.0](docs/releases/ATUALIZACAO_V2.2.0.md)
