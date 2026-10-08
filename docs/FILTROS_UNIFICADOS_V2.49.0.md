# V2.49.0 — Sistema unificado de filtros

## Objetivo

Normalizar a barra superior do Performance Hub e impedir que cada módulo exponha filtros sem utilidade real. A V2.49.0 mantém a lógica já existente e reorganiza apenas a experiência de seleção de contexto.

A topbar passa a trabalhar com quatro conceitos canônicos:

- **Squad**;
- **Competência**;
- **Período**;
- **Técnico**.

O filtro **Período** concentra o antigo `De`, `Até` e os atalhos de data em um único componente do Design System.

## Compatibilidade

Os estados oficiais não mudaram:

- `squadSelect` / `state.squadCode`;
- `monthSelect` / `state.currentId`;
- `techSelect` / `state.techName`;
- `state.analysisStartDate`;
- `state.analysisEndDate`.

URLs, Visões salvas, favoritos e filtros lembrados continuam usando os mesmos valores `squad`, `month`, `tech`, `from` e `to`. Rotas antigas continuam sendo aceitas; ao serem regravadas, somente filtros úteis ao contexto atual permanecem na URL.

## Matriz de filtros por contexto

| Contexto | Squad | Competência | Período | Técnico |
| --- | :---: | :---: | :---: | :---: |
| Início | ✓ | ✓ | — | — |
| Meu desempenho | ✓ | ✓ | ✓ | ✓ |
| Visão do Squad | ✓ | ✓* | ✓ | — |
| Indicadores · Desempenho/Qualidade/Detalhe | ✓ | — | ✓ | — |
| Indicadores · Impacto financeiro | — | — | — | — |
| Indicadores · Por dias úteis | ✓ | — | — | — |
| Apresentação | ✓ | — | ✓ | — |
| Operação | ✓ | ✓ | — | — |
| Bonificação | ✓ | ✓ | — | — |
| Custos | — | — | — | — |
| Feedbacks | ✓ | ✓ | — | — |
| Configurações · Operação/Bonificação/Aparência/TV | ✓ | — | — | — |
| Usuários/Auditoria/Alertas/Perfil/Como usar | — | — | — | — |

\* Em **Todos os Squads**, a competência é ocultada em Visão do Squad porque a tela consolidada usa exclusivamente o período analítico.

Para Técnico, Squad e Técnico não são exibidos quando são contextos fixos do próprio usuário.

## PeriodPicker

O novo seletor abre um único painel com:

- Hoje;
- Últimos 7 dias;
- Últimos 15 dias;
- Este mês;
- Mês anterior;
- navegação mensal;
- seleção De → Até;
- Cancelar;
- Aplicar período.

Ele respeita os limites dos dados importados e escreve nos mesmos `analysisStartDate` e `analysisEndDate` usados anteriormente. Nenhuma fórmula ou consulta ganhou uma segunda fonte de período.

## Responsividade

### Desktop

Os filtros úteis permanecem diretamente na topbar.

### Largura intermediária

A barra pode quebrar de forma controlada, sem aumentar o `scrollWidth` global.

### Mobile

Os filtros oficiais são substituídos visualmente pelo botão **Filtros**, que abre um drawer. O drawer trabalha em rascunho: alterações só atingem o estado oficial quando o usuário toca em **Aplicar**.

A ação **Limpar filtros** restaura apenas filtros disponíveis no contexto atual; filtros ocultos não são alterados silenciosamente.

## Indicadores

O antigo conjunto interno de campos `De` / `Até` deixa de aparecer. A área informa o período vigente e usa a topbar como fonte única. Submódulos com controles próprios, como **Impacto financeiro** e **Por dias úteis**, não recebem filtros globais redundantes.

## Banco e regras financeiras

- Não há migration V2.49.0.
- Nenhuma tabela, RLS ou RPC é alterada.
- A regra financeira permanece `FR-2.48.8-1`.
