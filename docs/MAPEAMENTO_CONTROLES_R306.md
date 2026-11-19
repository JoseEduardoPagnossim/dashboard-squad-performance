# R30.6 — Mapeamento de componentes nativos e correção do período global

## Calendários e campos de data (17)
O HTML da versão R30.5.1 continha **6 campos `date`, 9 campos `month` e 2 campos `datetime-local`** com seletores nativos do navegador. A R30.6 mantém os inputs originais no DOM para não quebrar a leitura, persistência e eventos já usados pelos módulos, mas os substitui visualmente por um seletor de data no estilo do Performance Hub.

### Módulos mapeados
- Gestão Estratégica → Receita Direta: `strategyDirectRevenueDate`
- Gestão Estratégica → Receita Influenciada: `strategyInfluencedRevenueDate`
- Gestão Estratégica → Receita Protegida: `strategyProtectedRevenueDate`, `strategyProtectedRevenueVerifiedDate`
- Gestão Estratégica → Importações: `strategyCsvMonth`, `strategyCommercialCsvAuditMonth`
- Comercial → Comissões: `strategyCommissionMonth`
- Financeiro → Fechamento: `strategyFinanceCloseMonth`
- Lançamentos manuais: `strategyManualMonth`, `strategyManualDate`
- Gestão Estratégica → Nova competência: `strategyNewCompetenceInput`
- Calendário operacional: `businessCalendarDateInput`
- Bonificação de líderes: `financeLeaderPeriod`
- Auditoria de vendas: `financeSalesAuditMonth`
- Notificações: `notificationStartsAtInput`, `notificationExpiresAtInput`
- Cadastro/Movimentação de usuários: `editUserEffectiveMonth`

### Padrão aplicado
- Meses e dias com navegação customizada, sem abrir o calendário nativo;
- seleção de horário para `datetime-local`;
- respeito aos limites `min`, `max` e campos obrigatórios;
- atualiza `value` e dispara eventos `input` e `change` compatíveis com os módulos;
- inclusão automática de campos que surjam dinamicamente no DOM.

## Período global / Aplicar análise
A popover era limitada pela altura e tinha rodapé no fim do conteúdo. Em zoom alto, o botão poderia ficar inacessível. A R30.6 separa rolagem do conteúdo e rodapé fixo dentro do popover, limita a altura à viewport e adapta o rodapé em telas estreitas.

## Outros componentes nativos encontrados (escopo de auditoria)
No HTML também existem **116 seletores `select`, 12 entradas de arquivo, 9 controles `range` e 6 entradas de cor**. Esses controles não são calendários; o projeto já dispõe de camada de Design System para parte dos `select` e estilos próprios para uploads, sliders e escolha de cores. **A R30.6 não substitui a semântica desses controles**, para não afetar interações de importação, gráficos ou acessibilidade. A avaliação funcional específica de cada um fica registrada como inventário, não como migração concluída.

## Validação e cuidados
- `npm run check`: testes estáticos e sintáticos do projeto;
- teste manual de navegador Chromium, viewport 390×530: troca de data e mês e confirmação de que o botão `Aplicar análise` permaneceu visível;
- não altera regras de negócio, SQL, snapshots, cálculo, comissão ou bonificação.
- Recomendável homologar em formulário de cada módulo e em 125%, 150% e 200% de zoom antes da publicação definitiva.
