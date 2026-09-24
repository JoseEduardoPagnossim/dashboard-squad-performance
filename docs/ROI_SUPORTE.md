# ROI do Suporte Técnico — V2.30.0

## Objetivo

O módulo **ROI do Suporte Técnico** consolida em uma única visão executiva o custo do Suporte, produtividade, base de clientes, churn, receita protegida estimada, receita adicional realizada, benefício econômico e ROI.

A implementação é híbrida: reutiliza dados já existentes no monitor, aceita premissas manuais e possui importações CSV para informações que ainda não existem de forma estruturada. Nenhuma API nova foi criada.

## Levantamento dos dados existentes

| Informação | Situação antes da V2.30.0 | Fonte usada pelo ROI | Origem exibida |
| --- | --- | --- | --- |
| Atendimentos | Existente | competências/técnicos já importados no monitor (`technician_monthly`) | Automático |
| Técnicos | Existente | técnicos das competências dos Squads | Automático |
| Equipes/Squads | Existente | estrutura de `squads` | Automático |
| Líderes/perfis administrativos | Existente como perfil/escopo de acesso | usado para permissão e auditoria, não como variável da fórmula do ROI | Automático |
| Período/datas | Existente | competências mensais já carregadas | Automático |
| Produtividade | Derivável | atendimentos ÷ técnicos ÷ dias úteis | Automático/calculado |
| Satisfação/Notas 5 | Existente no monitor | permanece disponível nos módulos atuais, mas não entra diretamente na fórmula financeira do ROI V1 | Automático |
| Custos gerais | Existente parcialmente | `support_monthly_costs` | Automático quando reaproveitado; Manual/Importado quando detalhado no ROI |
| Clientes ativos | Existente quando preenchido no Impacto financeiro | `quality_financial_monthly.active_clients` como fallback | Automático/reaproveitado |
| Ticket médio | Existente quando preenchido no Impacto financeiro | `quality_financial_monthly.avg_ticket` como fallback | Automático/reaproveitado |
| Clientes da carteira | Não havia fonte consolidada única | manual ou CSV mensal | Manual/Importado |
| Clientes atendidos únicos | Não pode ser obtido de forma confiável pelo CSV operacional atual, pois ele não traz identificador único de cliente | manual ou CSV mensal | Manual/Importado |
| Cancelamentos | Existem dados financeiros em contextos específicos, mas não foi identificada uma base corporativa única de cancelamentos do Suporte adequada para derivar o ROI | não reutilizado automaticamente na V1 | — |
| Churn do Suporte | Não havia indicador corporativo mensal confiável e único | manual ou CSV mensal | Manual/Importado |
| Receita adicional do Suporte | Não existia | nova tabela de oportunidades, manual ou CSV | Manual/Importado |
| FCR | Não identificado como indicador estruturado reutilizável no projeto atual | não usado na fórmula V1 | — |
| Reincidência | Não identificada como indicador estruturado reutilizável no projeto atual | não usada na fórmula V1 | — |
| Tempo médio de atendimento | Não identificado como indicador estruturado reutilizável no projeto atual | não usado na fórmula V1 | — |

A V2.30.0 não inventa valores para os itens ausentes. O painel sinaliza as premissas pendentes e mantém o cálculo incompleto até que os dados necessários sejam informados.

## Banco de dados

### Tabela reutilizada: `support_monthly_costs`

A tabela existente de custos mensais foi ampliada para evitar uma base paralela. Novos campos:

- `roi_cost_breakdown`: JSON com salários, encargos, benefícios, ferramentas, telefonia, infraestrutura, treinamentos, horas extras e outros custos;
- `roi_avg_ticket`;
- `roi_churn_reference`;
- `roi_churn_current`;
- `roi_portfolio_clients`;
- `roi_served_clients`;
- `roi_active_clients`;
- `roi_client_method`: `portfolio`, `served` ou `active`;
- `roi_notes`;
- `roi_data_origin`;
- `roi_field_origins`;
- `roi_source_file` / `roi_imported_at`;
- `roi_created_by` / `roi_created_at`;
- `roi_updated_by` / `roi_updated_at`.

O histórico mensal continua preservado pela chave organização + ano + mês. Uma nova competência cria outro registro; não substitui meses anteriores. Alterações administrativas também ficam registradas em `audit_logs` com antes/depois.

### Nova tabela: `support_roi_opportunities`

Armazena oportunidades originadas pelo Suporte:

- data;
- cliente;
- equipe;
- técnico;
- tipo;
- descrição;
- valor potencial;
- valor convertido;
- status: Pendente, Convertida, Perdida ou Cancelada;
- origem: Manual ou Importado;
- arquivo/linha e data de importação quando importado;
- usuário/data de criação e alteração.

Somente registros com status **Convertida** entram na receita adicional realizada.

A tabela possui RLS e acesso somente para Admin Geral da mesma organização.

## Fórmulas

### Custo total

`Custo total = salários + encargos + benefícios + ferramentas + telefonia + infraestrutura + treinamentos + horas extras + outros custos`

Quando ainda não há detalhamento de ROI para uma competência, a aplicação pode reaproveitar o total legado de `Pagamentos + Outros custos` da área Gestão > Custos.

### Custo por atendimento

`Custo por atendimento = custo total do suporte ÷ atendimentos`

### Custo por cliente

`Custo por cliente = custo total do suporte ÷ clientes considerados`

O painel mostra explicitamente qual conceito está ativo: carteira, atendidos ou ativos.

### Clientes preservados

`Clientes preservados = clientes × (churn de referência − churn atual)`

### Receita protegida estimada

`Receita protegida mensal = clientes preservados × ticket médio`

`Equivalente anual = receita protegida mensal × 12`

O equivalente anual é apenas referência executiva. O **ROI mensal usa a receita protegida mensal**, para manter custo e benefício no mesmo período.

### Receita adicional realizada

`Receita adicional realizada = soma(valor convertido) das oportunidades com status Convertida`

### Benefício econômico

`Benefício econômico = receita protegida estimada mensal + receita adicional realizada`

O painel separa o componente **estimado** (retenção) do componente **realizado** (oportunidades convertidas).

### ROI

`ROI = (benefício econômico − custo do suporte) ÷ custo do suporte × 100`

O ROI só é calculado quando existe custo maior que zero.

### Produtividade

`Produtividade = atendimentos ÷ técnicos com produção ÷ dias úteis considerados`

## Tela executiva

A nova opção **ROI do Suporte** aparece somente para Admin Geral e contém:

1. cards executivos;
2. comparação com a competência anterior;
3. transparência/origem dos dados;
4. configurações financeiras mensais;
5. importações CSV;
6. cadastro e histórico de oportunidades;
7. histórico mensal, trimestral e anual;
8. gráficos de ROI, custo x benefício, churn x receita protegida, custo por atendimento e composição do benefício;
9. simulador de impacto claramente identificado como projeção;
10. seção de premissas e metodologia;
11. modais “Como este valor foi calculado?”.

## Importação CSV

### Configurações mensais

Modelo: `models/roi_configuracoes_mensais.csv`

Colunas:

| Coluna | Formato | Descrição |
| --- | --- | --- |
| `competencia` | `AAAA-MM` | competência mensal |
| `salarios` | número | custo com salários |
| `encargos` | número | encargos |
| `beneficios` | número | benefícios |
| `ferramentas` | número | ferramentas/software |
| `telefonia` | número | telefonia/comunicação |
| `infraestrutura` | número | infraestrutura |
| `treinamentos` | número | treinamentos |
| `horas_extras` | número | horas extras/adicionais |
| `outros_custos` | número | demais custos |
| `ticket_medio` | número | ticket médio mensal |
| `churn_referencia_pct` | 0 a 100 | churn de referência em percentual |
| `churn_atual_pct` | 0 a 100 | churn atual em percentual |
| `metodologia_clientes` | `ativos`, `atendidos` ou `carteira` | conceito usado no custo por cliente/retenção |
| `clientes_carteira` | inteiro | carteira total |
| `clientes_atendidos` | inteiro | clientes únicos atendidos |
| `clientes_ativos` | inteiro | clientes ativos |
| `observacao` | texto opcional | premissa ou nota da competência |

A importação apresenta prévia e erros antes da confirmação e grava arquivo/data da importação.

### Oportunidades

Modelo: `models/roi_oportunidades.csv`

| Coluna | Formato | Descrição |
| --- | --- | --- |
| `data` | `AAAA-MM-DD` ou `DD/MM/AAAA` | data da oportunidade |
| `cliente` | texto | cliente |
| `equipe` | texto | ex.: `Squad D` |
| `tecnico` | texto | responsável/origem |
| `tipo` | texto | tipo da oportunidade |
| `descricao` | texto | contexto |
| `valor_potencial` | número | valor potencial |
| `valor_convertido` | número | valor efetivamente convertido |
| `status` | Pendente/Convertida/Perdida/Cancelada | estado da oportunidade |

A importação usa chave arquivo + linha para permitir reprocessamento do mesmo arquivo sem duplicar a mesma linha e registra a data/hora da importação.

## Origem dos dados

O detalhe do indicador identifica:

- **Automático**: reaproveitado do monitor ou calculado a partir dele;
- **Manual**: cadastrado pelo gestor;
- **Importado**: recebido pelo CSV do ROI;
- **Manual + Importado**: composição de oportunidades realizadas com mais de uma origem.

## Simulador

O simulador não grava e não altera resultados realizados. Permite variar:

- clientes;
- ticket médio;
- churn atual;
- churn projetado;
- custo do suporte;
- atendimentos;
- receita adicional.

Mostra clientes preservados, receita protegida mensal/anual, benefício econômico e ROI projetado. Todos os resultados são identificados como **SIMULAÇÃO / PROJEÇÃO**.

## Limitações atuais

- não existe integração por API para este módulo;
- churn é uma premissa manual/importada até existir uma fonte corporativa confiável;
- clientes atendidos únicos não são derivados do CSV operacional atual por falta de identificador único do cliente;
- FCR, reincidência e tempo médio de atendimento não foram usados porque não há fonte estruturada confiável no projeto atual;
- receita protegida é uma **estimativa** e não deve ser apresentada como faturamento;
- o equivalente anual da receita protegida é uma projeção de referência, não é somado ao ROI mensal;
- o módulo é restrito ao Admin Geral porque contém custos e informações financeiras sensíveis.

## Preparação para API futura

A regra de negócio foi separada em `js/roi-rules.js`. A origem dos dados é resolvida em `js/app.js` antes de chamar as funções de cálculo.

No futuro, uma API pode substituir o preenchimento de churn, clientes, ticket ou oportunidades sem reescrever as fórmulas. Basta transformar a resposta externa para o mesmo objeto mensal consumido por `calculateMonthlyRoi()`.
