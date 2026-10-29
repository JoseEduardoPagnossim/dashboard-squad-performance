# Regras permanentes do Dashboard Squad Performance

**Obrigatório antes de implementar qualquer versão da Fase 8:** ler `docs/FASE8_REGRAS_OBRIGATORIAS_V2.63.0.md` integralmente. Essas são decisões de negócio aprovadas pelo usuário e prevalecem sobre suposições do desenvolvedor. Não alterar sem autorização.

Release incremental: preservar dados e migrations anteriores; não alterar snapshots oficiais; testar `npm run check`; entregar ZIP com somente arquivos modificados, patch aplicável, migration SQL quando necessário, documentação e sempre uma mensagem de commit pronta. Mantenha os controles de segurança multi-tenant e o Pré-atendimento separado dos indicadores operacionais do Suporte.

**Fase 8, V2.63.1:** ler também `docs/IMPORTADOR_CSV_CONFIGURAVEL_V2.63.1.md` antes de alterar parser, modelos e importações de receitas. O reconhecimento de produtos nesta versão é somente prévia; nenhuma venda/comissão pode ser lançada prematuramente.

**Fase 8, V2.63.2:** consultar `docs/CONCILIACAO_PESSOAS_SQUADS_V2.63.2.md` antes de alterar identidades/aliases. Nunca associar vendedor sem Squad válido, conta ativa e `strategy_people.user_id` da mesma organização. Pré-atendimento somente Squad C, sem dados operacionais.

**Fase 8, V2.63.3:** consultar `docs/CATALOGO_COMERCIAL_COMISSOES_V2.63.3.md` antes de modificar catálogo/comissões. A origem define MRR; não juntar produtos de fontes diferentes, nem pagar comissões nesta etapa. Toda alteração de regra cria revisão imutável, sem alterar snapshots anteriores.

**Fase 8, V2.63.4:** consultar `docs/IMPORTACAO_RECEITA_RECORRENTE_V2.63.4.md`. Novo MRR somente por vendas únicas do CSV Anotação de Venda, nunca por `Vl Anterior`, nunca recalcular comissão. Reimportações são idempotentes pela identidade e confirmadas no Supabase; fechamento e histórico permanecem protegidos.
