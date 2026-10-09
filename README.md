# Soften Performance Hub

![Quality Gate](https://github.com/JoseEduardoPagnossim/dashboard-squad-performance/actions/workflows/quality.yml/badge.svg)

Dashboard interno para acompanhamento de performance, qualidade, metas, gamificação, bonificação e indicadores dos Squads de Suporte da Soften Sistemas.

**Versão atual:** `2.50.0`<br>



















## V2.50.0 — Análise comparativa e transparência

- **Meu desempenho** ganha comparação opcional com **Mês anterior · mesmo recorte** ou **Período anterior equivalente**.
- Os KPIs de Atendimentos, Notas 5, % avaliado e Nota média mostram a variação contra o período de referência sem alterar o período oficial da análise.
- Comparações carregam sob demanda apenas as competências adicionais necessárias, preservando o modelo de performance introduzido nas versões anteriores.
- Cada KPI passa a oferecer **Entenda este número**, com componentes, fórmula aplicada, metas/referências e observações da regra.
- A agregação por período passa a aceitar explicitamente intervalos arbitrários, permitindo comparar recortes que atravessam competências sem reutilizar acidentalmente o período global.
- Pontuação continua identificada como **oficial do mês** e sua explicação deixa claro que não é recalculada pelo recorte diário.
- Frontend-only; sem migration e sem alteração das regras financeiras existentes.

Detalhes: `docs/ANALISE_COMPARATIVA_V2.50.0.md`.

## V2.49.1 — Período de análise unificado

- **Competência + Período** viram um único controle visual **Período de análise** nas telas que trabalham com recorte de datas.
- O seletor possui dois modos: **Por competência** e **Intervalo livre**.
- Em **Por competência**, a competência define o calendário e permite **Mês completo**, **Até hoje**, **1ª quinzena**, **2ª quinzena** ou **Personalizado**.
- Em **Intervalo livre**, o usuário pode atravessar duas ou mais competências sem perder os cálculos por `analysisStartDate` / `analysisEndDate`.
- Metas de atendimento e notas 5 continuam proporcionais por competência quando o período atravessa meses.
- URLs, Visões e parâmetros `month`, `from` e `to` permanecem compatíveis.
- Sem migration; alteração concentrada em UX e normalização do estado analítico.

Detalhes: `docs/PERIODO_ANALISE_UNIFICADO_V2.49.1.md`.

## V2.49.0 — Sistema unificado de filtros

- Normaliza a topbar em **Squad | Competência | Período | Técnico**, exibindo somente filtros que alteram o contexto da tela atual.
- Consolida `De`, `Até`, `Hoje`, `7 dias`, `15 dias` e `Este mês` em um único **PeriodPicker** do Design System e acrescenta o atalho **Mês anterior**.
- Mantém `squad`, `month`, `tech`, `from` e `to` como estados/parametros oficiais, preservando URLs, Visões salvas, favoritos e filtros persistentes existentes.
- Indicadores deixam de duplicar filtros de data; submódulos com filtros próprios não exibem controles globais redundantes.
- Em telas estreitas, um drawer **Filtros** trabalha em rascunho e só altera o painel ao clicar em **Aplicar**.
- A Home passa a respeitar explicitamente Squad e Competência selecionados, inclusive no consolidado de Todos os Squads.
- Nenhuma migration ou regra financeira foi alterada; `FR-2.48.8-1` permanece vigente.

Detalhes: `docs/FILTROS_UNIFICADOS_V2.49.0.md`.

## V2.48.14 — Ritmo do mês e leitura clara do período

- **Meu desempenho** passa a abrir com um resumo horizontal de **Ritmo do mês**, separado do recorte diário.
- Atendimentos e Notas 5 mostram progresso mensal, faltante e ritmo diário necessário usando as metas oficiais da competência.
- Os KPIs abaixo são rotulados explicitamente como **no período** e exibem a meta proporcional do recorte sem sugerir que a meta mensal já foi atingida.
- `% Avaliado` diferencia a taxa do período da meta mensal em pontos percentuais.
- O card antigo **Como está o seu ritmo?** foi removido para evitar informação mensal duplicada.
- A data exata do recorte aparece uma única vez no cabeçalho **Desempenho no período selecionado**; hero e histórico diário deixam de repetir o intervalo.
- Pontuação permanece identificada como **oficial do mês**, pois não é recalculada pelo recorte diário.
- Mudança somente de frontend/UX; nenhuma regra financeira, importação, filtro, sidebar ou migration foi alterada.

## V2.48.13 — Central de Importação responsiva

- A dialog de importação agora possui cabeçalho, corpo com rolagem própria e rodapé fixo, mantendo o botão de importação acessível em 100% de zoom.
- O fundo do painel fica bloqueado enquanto uma modal está aberta.
- O escopo da importação é escolhido dentro da própria dialog: Todos os Squads ou um Squad específico, sem depender nem alterar o filtro externo.
- Trocar o Squad reaproveita o mesmo CSV e recalcula vínculos, competência, prévia e validações.
- A Central de Importação aceita arrastar e soltar CSVs tanto na tela de Operação quanto dentro da dialog; o botão Escolher CSV continua disponível.
- Nenhuma regra financeira, de pontuação ou de importação foi alterada.

Detalhes: `docs/IMPORTACAO_V2.48.13.md`.

## V2.48.12 — Estabilização visual da Topbar

- Corrige o recorte vertical dos valores de Squad, Mês e Técnico introduzido pela V2.48.11 em alguns navegadores/níveis de zoom.
- Mantém a caixa externa dos filtros em 44 px e reorganiza somente o conteúdo visual interno em coluna flexível, com alturas explícitas para rótulo e valor.
- Não altera os `<select>` originais, listeners, estado, URL persistente, calendário, sidebar ou regras financeiras.
- Adiciona teste estrutural contra regressão de overflow/recorte vertical dos filtros do topo.

Detalhes: `docs/TOPBAR_ESTABILIDADE_V2.48.12.md`.

## V2.48.11 — Topbar legível e calendário do Design System

- Reorganiza visualmente os filtros de **Squad, Mês e Técnico** na topbar: o rótulo fica acima do valor, liberando a largura do campo para o conteúdo selecionado sem alterar os `selects` originais nem seus eventos.
- Aumenta a largura útil dos atalhos de período para evitar textos cortados como **Este mês**.
- Substitui o calendário nativo usado nos filtros de período por um calendário próprio do Design System, com navegação mensal, limites de datas importadas, destaque do intervalo e ação **Hoje**.
- A seleção continua chamando o mesmo `handleAnalysisDateInput()`, preservando URL, estado, filtros e cálculos.
- O mesmo calendário é usado nos filtros de período da topbar e dos Indicadores.
- Não altera sidebar, motor financeiro, bonificação, Supabase ou schema. Não exige migration.

Detalhes: `docs/TOPBAR_CALENDARIO_V2.48.11.md`.

## V2.48.10 — Bonificação orientada ao fechamento

- Remove os três cards-legado de redirecionamento para Configurações em Operação, Bonificação e Apresentação/TV. As rotas continuam disponíveis pelo menu, Central de Configurações e busca global.
- Reorganiza **Gestão → Bonificação** para abrir pelo **Fechamento Financeiro / Técnicos do Squad**, priorizando o valor real da competência.
- Adiciona três KPIs diretamente ligados ao mesmo consolidado usado pelo motor financeiro: **média de atendimentos/técnico/dia do Squad**, **taxa de Notas 5 do Squad** e **cancelados da competência**.
- Cada KPI mostra faixa atual e efeito financeiro correspondente; o cabeçalho informa competência, modelo oficial, dias úteis e técnicos considerados.
- Move **Histórico de cálculo e auditoria** e **Simulador de bonificação** para o final do módulo, recolhidos por padrão.
- Mantém regras financeiras, filtros, sidebar, topbar, fechamento e persistência sem alterações. Não exige migration.

Detalhes: `docs/BONIFICACAO_FECHAMENTO_V2.48.10.md`.

## V2.48.9 — Limpeza visual da governança financeira

- Remove da interface da Bonificação os códigos técnicos de versão da regra financeira e assinatura da configuração.
- Mantém versão e fingerprint preservados internamente em memória de cálculo, auditoria, snapshots e relatórios.
- Simplifica a identificação visual da memória de cálculo sem alterar nenhuma regra financeira.
- Não exige migration.

## V2.48.8 — Exceções de desconto e bonificação compacta

- Técnicos marcados como **Férias** continuam recebendo 50% da comissão-base e agora ficam automaticamente isentos do desconto financeiro por status `ABAIXO`.
- Novo checkbox **Isentar desconto ABAIXO** por técnico/competência, sem retirar o profissional da média do Squad; a isenção também impede que o valor alimente o pool de redistribuição.
- A redistribuição para técnicos `ACIMA` continua normal, inclusive para quem tem a isenção manual ou férias, desde que não esteja marcado como competência parcial.
- A tela **Gestão → Bonificação → Técnicos do Squad** foi reorganizada em grade compacta, com resumo financeiro e controles em duas faixas, mantendo detalhes e auditoria recolhíveis.
- Exige `MIGRACAO_V2.48.8.sql`.

Detalhes: `docs/BONIFICACAO_EXCECOES_V2.48.8.md`.

## V2.48.7 — Calendário operacional e filtros legíveis

- Adiciona **Configurações → Bonificação → Calendário operacional**, compartilhado por todos os Squads da organização.
- A Base do Squad passa a calcular dias úteis como **segunda a sexta − dias não úteis ativos**.
- Inclui feriados nacionais fixos como padrão e permite cadastrar/desativar feriados estaduais, municipais e recessos da empresa.
- A memória da bonificação mostra dias seg–sex, datas descontadas, dias úteis válidos, técnicos considerados e a fórmula da média do grupo.
- Meses fechados congelam a memória do calendário; mudanças posteriores não alteram comissão já fechada.
- Ajusta apenas a largura visual dos filtros da topbar para melhorar a leitura de Squad, mês e técnico, sem trocar elementos, listeners ou lógica.
- Exige `MIGRACAO_V2.48.7.sql`.

Detalhes: `docs/CALENDARIO_OPERACIONAL_V2.48.7.md`.

## V2.48.6 — Hotfix de layout e selects invisíveis

Correção crítica da V2.48.5. O select nativo permanece como fonte funcional do Design System, mas agora é isolado de regras legadas de largura com especificidade suficiente para nunca ampliar o documento horizontalmente. O patch remove o scroll global que deslocava o painel e fazia a sidebar desaparecer visualmente.

Detalhes: `docs/REGRESSAO_LAYOUT_V2.48.6.md`.

## V2.48.5 — Controles estáveis e revisão de regressão

Patch corretivo da V2.48.4. Os selects continuam totalmente personalizados, mas o elemento nativo não é mais movido no DOM. Isso preserva os filtros encadeados de Squad, mês, técnico, grupos, tabelas e configurações dinâmicas. A sidebar também recupera uma única vez grupos/subgrupos que tenham ficado indevidamente recolhidos na transição anterior.

A revisão mantém todos os demais tipos de campo no Design System e adiciona validações específicas para selects dinâmicos e dependentes. Validação final: **201/201 testes aprovados**, além de smoke funcional em Chromium para filtros dependentes e controles.

Detalhes: `docs/CONTROLES_ESTAVEIS_V2.48.5.md`.

## V2.48.4 — Design System completo e sidebar estabilizada

Revisão global dos campos de formulário para impedir que controles do Chrome/Edge escapem do Design System. Pesquisa, números, selects, datas, cores, checkbox/radio, sliders e uploads passam a ter comportamento visual consistente. A sidebar de desktop também foi consolidada em uma grade vertical estável, deixando apenas a navegação com scroll.

Detalhes: `docs/CONTROLES_DESIGN_SYSTEM_V2.48.4.md`.

## V2.48.3 — Tipografia e consistência de configuração

A Aparência passa a permitir três fontes do sistema (Inter, Roboto e Source Sans 3), persistidas no próprio tema. O Design System também padroniza controles que ainda dependiam do visual nativo do navegador. O editor de tema agora trabalha em rascunho, com preview, **Salvar tema** e **Cancelar**, evitando persistência enquanto o administrador ainda está experimentando as opções.

A migration `MIGRACAO_V2.48.3.sql` apenas atualiza a RPC pública de identidade visual para incluir `fontFamily`; não cria ou altera tabelas.


## V2.48.2 — Tema persistente antes do login e carregamento sem flicker

Patch corretivo que elimina a dependência exclusiva do cache do navegador para a identidade visual pública e impede a troca temporária para **Brasil em Campo** durante o carregamento.

- quando existe cache local válido, ele continua sendo usado para acelerar o primeiro paint;
- sem cache, a tela de boot usa identidade neutra da Soften em vez do tema futebol;
- uma RPC pública e sanitizada recupera do Supabase somente a identidade visual antes do login;
- o tema exato do Squad autenticado é aguardado antes de liberar a Home;
- remove imagens de futebol hardcoded do HTML inicial e do `--hero-img` padrão;
- mantém RLS das tabelas: nenhuma tabela de tema passa a aceitar `SELECT` anônimo;
- **exige `MIGRACAO_V2.48.2.sql`**;
- suíte automatizada validada com **187/187 testes aprovados**.

Detalhes: `docs/TEMA_BOOTSTRAP_V2.48.2.md`.

## V2.48.1 — Sidebar responsiva em zoom e viewport reduzida

Patch corretivo da V2.48 que impede a barra lateral de esconder a arte da campanha, player e versão quando o navegador está em 100% de zoom ou a altura útil da janela é menor. O cabeçalho e o rodapé ficam preservados e somente a lista de navegação assume rolagem interna.

- menu lateral passa a respeitar `100dvh`;
- a navegação recebe `min-height: 0` e scroll vertical próprio;
- campanha deixa de ser ocultada em desktop por regras antigas de `max-height`;
- a arte fica progressivamente mais compacta em alturas abaixo de 900 px e 760 px;
- versão permanece visível;
- sidebar recolhida e comportamento mobile continuam preservados;
- não exige migration de banco.

Detalhes: `docs/SIDEBAR_RESPONSIVA_V2.48.1.md`.

## V2.48.0 — Visões salvas, filtros persistentes e favoritos

A V2.48 transforma a navegação persistente da V2.47 em um espaço pessoal de trabalho por usuário.

Principais entregas:

- estrela no topo para favoritar a visão atual com todos os filtros relevantes;
- painel **Visões** com favoritos, visões salvas e controle de filtros persistentes;
- salvamento nomeado da tela atual incluindo seção, Squad, competência, técnico e período;
- abrir, renomear, excluir e favoritar visões salvas;
- favoritos e visões salvas também aparecem na busca global `Ctrl+K`;
- memória automática de Squad, mês, técnico e período por contexto de tela;
- filtros explícitos da URL ou de uma visão salva têm prioridade sobre a memória automática;
- persistência reutiliza `profiles.ui_preferences` e a RPC `save_my_ui_preferences`, com fallback local;
- limites defensivos de 30 visões salvas, 20 favoritos e 40 contextos de filtros;
- não exige migration nova;
- suíte automatizada validada com **180/180 testes aprovados**.

Detalhes: `docs/VISOES_FAVORITOS_V2.48.0.md`.

## V2.47.1 — Correção da importação de notas Produto/Empresa

Patch corretivo da Central de Importação. O CSV de avaliações agora usa a mesma tolerância de cabeçalhos já disponível no Impacto Financeiro.

- aceita `DataAvaliacao`, `Data Avaliação`, `Data da Avaliação`, `Time` ou `Data`;
- aceita `nomeApresentativo`, `Técnico`, `Tecnico` ou `Atendente`;
- continua exigindo `NotaProduto` e `NotaEmpresa`;
- `NotaServico` permanece ignorada nessa importação;
- arquivo real de setembro validado com 1.706 linhas de dados;
- não exige migration;
- suíte automatizada validada com **167/167 testes aprovados**.

Detalhes: `docs/IMPORTACAO_QUALIDADE_V2.47.1.md`.

## V2.47.0 — Busca global / Ctrl+K + breadcrumbs + URLs persistentes

A V2.47 unifica a navegação do Performance Hub e reduz a dependência do menu lateral para encontrar recursos.

Principais entregas:

- **Ctrl+K / Cmd+K** abre uma busca global por telas, Indicadores, Configurações, Squads e técnicos disponíveis no perfil;
- resultados da busca respeitam as permissões efetivas do usuário;
- breadcrumbs exibem a hierarquia funcional da tela e permitem voltar a níveis navegáveis;
- a URL passa a refletir página, seção, módulo, Squad, competência, técnico e período quando aplicável;
- Voltar/Avançar do navegador restaura a rota sem criar estados duplicados;
- filtros atualizam a URL com `replaceState`, enquanto mudanças de tela entram no histórico;
- atualizar a página ou abrir um link copiado restaura a mesma área após o login;
- rota normal da Apresentação usa `page=presentation` e permanece separada do modo TV legado `view=presentation`;
- novo `js/navigation-engine.js` centraliza parsing de rota e busca;
- não exige migration de banco;
- suíte automatizada validada com **164/164 testes aprovados**.

Detalhes: `docs/NAVEGACAO_GLOBAL_V2.47.0.md`.

## V2.46.0 — Central de Alertas + notificações internas

A V2.46 transforma os sinais já existentes do painel em uma central única de acompanhamento e adiciona comunicação interna persistente dentro do Performance Hub.

Principais entregas:

- sino de notificações no topo com contador individual de não lidas;
- nova tela **Central de Alertas** com filtros por status, origem, prioridade, categoria e busca;
- alertas automáticos de ritmo, projeção, avaliação, risco técnico e cobertura de dados;
- notificações internas publicadas por Administradores para todos, administradores, técnicos ou um Squad específico;
- prioridade, categoria, período de validade e botão opcional de ação;
- leitura individual por usuário e opção **Marcar tudo como lido**;
- histórico administrativo das notificações publicadas, com status Ativa, Agendada, Expirada ou Encerrada;
- atualização automática das notificações internas a cada 60 segundos;
- fallback local no modo demonstração;
- auditoria de publicação e encerramento;
- novas permissões `notifications.view` e `notifications.manage`.

### Atualização de banco obrigatória

Antes de usar notificações internas no ambiente Supabase, execute:

`supabase/migrations/MIGRACAO_V2.46.0.sql`

Os alertas automáticos continuam funcionando mesmo se essa migration ainda não tiver sido executada.

Detalhes: `docs/ALERTAS_NOTIFICACOES_V2.46.0.md`.

## V2.45.2 — Filtros superiores e importação deduplicada

Patch corretivo que centraliza a regra dos filtros superiores por módulo e torna a importação de **Indicadores > Impacto financeiro** compatível com os cabeçalhos reais já usados nas bases da operação.

Principais mudanças:

- elimina regras concorrentes de visibilidade entre navegação e permissões;
- exibe **De / Até** na Apresentação, que já utiliza o período selecionado;
- oculta filtros sem efeito em Usuários, Auditoria, Perfil, Ajuda, Custos e no escopo corporativo de Impacto financeiro;
- mantém Squad em Aparência, mas remove Mês, que não participa dessa configuração;
- aceita `DataAvaliacao`, `Data Avaliação`, `Data da Avaliação`, `Time` ou `Data`;
- aceita `NotaServico`, `Nota Serviço` ou `Nota Atendimento`;
- reconhece CSVs do Excel que começam com `sep=;`;
- mantém Produto e Empresa obrigatórios e melhora a mensagem quando uma coluna realmente estiver ausente;
- não exige migration de banco;
- suíte automatizada validada com **144/144 testes aprovados**.

Detalhes: `docs/FILTROS_IMPORTACAO_V2.45.2.md`.

## V2.45.1 — Correção da Home modular e espaçamento

Patch corretivo da V2.45. A Home volta a usar a grade real de 12 colunas mesmo quando há layout pessoal ativo; os tamanhos Pequeno/Médio/Largo/Total passam a alterar a largura visual dos widgets. Também foi corrigido o estado de widgets ocultos após Salvar/Cancelar e ampliado o mapeamento de espaçamento entre grupos de cards.

Detalhes: `docs/HOME_MODULAR_V2.45.1.md`.

## V2.45.0 — Home modular e correção de espaçamento

A V2.45.0 corrige pontos do Design System em que alguns cards herdados não possuíam padding interno próprio e transforma a Home em um painel modular por usuário.

Principais mudanças:

- corrige o respiro interno de cards em Configurações, Performance, Gestão Preditiva, Auditoria, Perfil, Como usar e blocos históricos;
- mantém os gaps entre cards consistentes nos grids afetados;
- Home passa a usar uma grade de 12 colunas com widgets reordenáveis;
- botão **Organizar Home** ativa edição visual sem alterar os dados do painel;
- widgets podem ser arrastados e soltos, ocultados/exibidos e receber tamanhos compatíveis (Pequeno, Médio, Largo ou Total);
- a edição também fica disponível em **Configurações → Meu painel**, com setas como fallback de acessibilidade;
- preferências continuam salvas em `profiles.ui_preferences`, portanto não há migration nova;
- layout é responsivo: tamanhos convergem automaticamente para colunas seguras em tablets e celulares;
- Técnicos não recebem o widget administrativo de visão dos Squads.
- suíte automatizada validada com **134/134 testes aprovados**.

Detalhes: `docs/HOME_MODULAR_V2.45.0.md`.

## V2.44.0 — Design System e padronização visual

A V2.44.0 consolida a linguagem visual do Performance Hub. Foi criada uma camada própria de **Design System** para padronizar tipografia, espaçamento, controles, cards, tabelas, estados e responsividade sem alterar regras de negócio ou a arquitetura de carregamento rápido da V2.43.

Principais mudanças:

- novo `css/design-system.css` com tokens visuais `--ds-*`;
- novo `js/design-system.js` para classificar cards e tabelas de forma leve;
- cards diferenciados por finalidade: KPI, análise e configuração;
- botões, inputs, selects, textareas, foco, hover e disabled padronizados;
- tabelas com cabeçalho fixo, linhas alternadas discretas, primeira coluna fixa em grades largas e densidade automática;
- números tabulares para facilitar comparação vertical;
- preferência de densidade compacta/confortável passa a refletir também em cards e tabelas;
- apresentação/TV mantém camada visual própria;
- nenhuma migration nova é necessária;
- suíte automatizada validada com **129/129 testes aprovados**.

Detalhes: `docs/DESIGN_SYSTEM_V2.44.0.md`.

## V2.43.2 — Simplificação de perfis e permissões

A V2.43.2 alinha o controle de acesso ao uso real da operação. A aplicação passa a trabalhar com apenas dois perfis ativos: **Administrador** (`super_admin`) e **Técnico** (`technician`). O antigo **Admin de Squad** deixa de aparecer na interface e não pode mais ser criado pelas Edge Functions.

Principais mudanças:

- Administradores possuem acesso completo a todos os Squads e módulos;
- overrides individuais não reduzem permissões de Administradores;
- restrições específicas permanecem apenas para Técnicos e nunca elevam privilégios;
- registros legados `squad_admin` são convertidos para `super_admin` pela migration;
- cadastro, edição de usuários, Home, ajuda e matriz de permissões exibem somente Administrador e Técnico;
- `create-user` e `manage-user` aceitam somente os dois perfis ativos;
- `can_admin_squad()` mantém o nome por compatibilidade, mas concede administração somente a `super_admin`.
- suíte automatizada validada com **122/122 testes aprovados**.

> Execute `supabase/migrations/MIGRACAO_V2.43.2.sql`, republique as Edge Functions `create-user` e `manage-user` e depois publique o frontend.

Detalhes: `docs/PERFIS_PERMISSOES_V2.43.2.md`.

## V2.43.1 — Métricas de performance e ajustes finos

A V2.43.1 mantém o carregamento rápido da V2.43 e adiciona uma camada de **observabilidade leve** para acompanhar o comportamento real do sistema sem voltar a pesar o login.

Principais mudanças:

- mede o tempo completo entre o clique em **Entrar** e a Home utilizável;
- mantém o detalhamento das etapas do login para diagnóstico técnico;
- mede carregamentos lazy por módulo e por competência;
- contabiliza **cache hit, miss, stale e write** durante a sessão;
- monitora **long tasks** do navegador quando a API está disponível;
- captura erros JavaScript e promises rejeitadas sem enviar stack, senha ou conteúdo operacional;
- envia telemetria em lote e somente em segundo plano, depois da interface utilizável;
- adiciona `Configurações → Performance` para Administrador com média, P95, erros e módulos mais lentos;
- adiciona exportação JSON do diagnóstico local + histórico agregado;
- mantém fallback local caso a migration V2.43.1 ainda não esteja instalada.

> Execute `supabase/migrations/MIGRACAO_V2.43.1.sql` para habilitar o histórico centralizado de performance. Sem ela, o painel continua rápido e o diagnóstico da sessão permanece disponível apenas localmente.

Detalhes: `docs/PERFORMANCE_OBSERVABILITY_V2.43.1.md`.

## V2.43.0 — Performance e carregamento progressivo

A V2.43.0 reduz o caminho crítico do login. Em vez de aguardar todos os Squads, todas as competências, métricas diárias, qualidade e financeiro antes de abrir a interface, o painel carrega primeiro um **contexto inicial enxuto** e libera a Home. Dados detalhados passam a entrar sob demanda.

Principais mudanças:

- RPC `get_initial_dashboard_context()` para perfil, permissões, Squads, índice de competências e resumo do período mais recente em uma única chamada;
- lazy loading por competência com `ensureMonthLoaded()`;
- paralelismo de consultas independentes com `Promise.all`;
- cache de sessão para contexto inicial, competências e temas;
- revalidação em segundo plano para sessões restauradas;
- consolidados organizacionais, comissões e históricos pesados carregados somente quando necessários;
- indicador discreto de carregamento durante hidratações sob demanda;
- diagnóstico disponível em `window.SoftenPerformanceDiagnostics`;
- preload/preconnect da biblioteca Supabase e trilha sonora com `preload=none`;
- remoção de assets históricos sem referência no runtime.

> Execute `supabase/migrations/MIGRACAO_V2.43.0.sql` antes de publicar o frontend para obter o ganho máximo. Se a RPC ainda não estiver instalada, existe fallback com consultas paralelas, porém menos eficiente.

Detalhes técnicos: `docs/PERFORMANCE_V2.43.0.md`.


## V2.42.0 — Navegação retrátil e avatar

A V2.42.0 reorganiza a navegação do Performance Hub sem alterar módulos ou regras de negócio. A sidebar pode ser **recolhida no desktop**, os grupos **Desempenho, Gestão e Conta** podem ser minimizados e a Gestão passa a expor submódulos de até dois níveis: **Financeiro, Pessoas e Governança**. O estado da navegação é salvo dentro de `ui_preferences`, reaproveitando a persistência individual criada na V2.38.

O perfil também passa a aceitar **avatar do próprio usuário**. A imagem é recortada e convertida para WebP no navegador, em até 256 × 256 px, com alvo de até 100 KB. Somente o arquivo otimizado vai para o bucket privado `user-avatars`; em `profiles` fica apenas `avatar_path`. A foto aparece no topo, Home e Meu perfil, mantendo as iniciais como fallback. Para evitar chamadas desnecessárias ao Storage, a listagem administrativa de usuários continua usando iniciais.

> Execute `supabase/migrations/MIGRACAO_V2.42.0.sql` antes de habilitar o envio de fotos em produção. A navegação retrátil funciona mesmo sem esta migration, pois reutiliza `ui_preferences`.

Detalhes: `docs/NAVEGACAO_PERFIL_V2.42.0.md`.


## V2.41.0 — Experiência inicial e Home

A V2.41.0 redesenha o primeiro contato com o sistema. O login passa a usar a **logo oficial da Soften**, uma composição em duas colunas no desktop e proporções mais consistentes de campos, botões e cards. Em telas menores, a estrutura se reorganiza para uma única coluna.

Após autenticar, o usuário entra na nova tela **Início**, em vez de cair diretamente em Meu desempenho. A Home é contextual: Técnicos recebem um resumo individual e Administradores recebem um panorama consolidado de todos os Squads. A partir da V2.43.2, Admin de Squad deixou de ser um perfil ativo.

Também foram adicionados **empty states acionáveis** em pontos críticos. Quando não há competência, vínculo ou dados suficientes, o painel explica o motivo e oferece o próximo passo possível, evitando a sensação de uma tela vazia.

Esta versão não muda regras de bonificação, importação, TV, permissões ou banco de dados e **não exige migration nova**. A suíte passa a **96 testes automatizados**.

## V2.40.1 — Como usar atualizado

A área **Como usar** foi reescrita para refletir o painel atual. O guia passou a possuir busca por assunto, atalhos para as principais telas, mapa completo dos módulos, passo a passo de importação, gestão preditiva, bonificação, configurações, usuários, feedbacks e TV/Comunicação.

O conteúdo respeita o perfil conectado: tópicos administrativos e recursos exclusivos do Administrador continuam ocultos quando não fazem parte do escopo do usuário. Também foram incluídos glossário prático de acesso, rotina mensal recomendada, regras de fechamento e aviso sobre recursos que dependem das migrations V2.36, V2.38, V2.39 e V2.40.

A V2.40.1 não exige nova migration. A suíte passou a **90 testes automatizados**.

## V2.40.0 — TV / Comunicação

A V2.40.0 transforma a Apresentação em uma central de comunicação para múltiplas telas. O Admin pode criar **playlists nomeadas**, reutilizar a mesma programação em várias TVs, cadastrar cada dispositivo físico e gerar uma **URL dinâmica por TV**.

As TVs cadastradas enviam um heartbeat periódico com estado de conexão, última sincronização, tela atual e resolução. O monitor classifica cada dispositivo como **Online**, **Atenção**, **Offline**, **Inativo** ou **Nunca conectou**. Alterações na playlist atribuída são reaplicadas automaticamente na próxima sincronização da TV, sem precisar trocar a URL física.

O novo `js/tv-engine.js` concentra normalização, status, resumo do monitor, URL de dispositivo e payload de heartbeat.

> Execute `supabase/migrations/MIGRACAO_V2.40.0.sql` antes de usar playlists compartilhadas, múltiplas TVs e monitoramento entre navegadores. Sem a migration, o painel mantém fallback local neste navegador.

Detalhes operacionais e de segurança: `docs/TV_COMUNICACAO_V2.40.0.md`.

## V2.39.0 — Financeiro avançado

A V2.39.0 acrescenta governança e rastreabilidade à bonificação sem alterar as regras oficiais já consolidadas. O motor financeiro expõe a **versão de regra** (`FR-2.39.0-1`) e uma **assinatura determinística da configuração**, permitindo identificar com quais parâmetros cada valor foi calculado.

A tela de Bonificação inclui **memória de cálculo imutável**, **simulador de cenários sem gravação** e explicação passo a passo do valor de cada técnico. O fechamento congela versão, assinatura, configurações e valores calculados. Excel e PDF também carregam a identificação da regra usada.

> Execute `supabase/migrations/MIGRACAO_V2.39.0.sql` para centralizar a memória de cálculo no Supabase. Sem a migration, o painel continua funcionando e mantém fallback local no navegador para as memórias criadas.

## V2.38.1 — Centralização das configurações

A Central de Configurações agora é o único local para alterar regras e comportamento dos módulos. Metas/referências, regras da bonificação, aparência/gráficos e configuração da Apresentação/TV foram retiradas das telas operacionais e agrupadas por módulo, com busca, filtros e indicação visual do módulo em cada card.

As telas de **Operação**, **Bonificação** e **Apresentação** permanecem focadas em dados, conferência, fechamento e exibição. Elas mantêm atalhos contextuais para abrir diretamente o módulo correto dentro de Configurações.

A competência usada por metas e regras financeiras pode ser trocada dentro da própria Central de Configurações. Aparência continua permitindo aplicação somente no Squad atual ou em todos os Squads.

## V2.38.0 — Configurações e personalização

A V2.38.0 cria uma **Central de Configurações** disponível para todos os perfis. Cada usuário pode organizar os blocos principais das telas permitidas, escolher densidade compacta ou confortável e ocultar informações que não utiliza no dia a dia. A preferência é individual e pode ser sincronizada pelo Supabase com a migração da versão.

Também entra o novo `js/settings-engine.js`, responsável pelos layouts e pelas permissões granulares. Na versão atual, Administradores sempre possuem acesso completo. A estrutura de permissões específicas é mantida para restringir somente recursos já permitidos ao Técnico; overrides nunca elevam privilégios.

> Execute `supabase/migrations/MIGRACAO_V2.38.0.sql` para sincronizar layouts entre dispositivos e persistir as permissões específicas.

## V2.37.0 — Gestão preditiva

A V2.37.0 adiciona uma camada preditiva aos Indicadores do Administrador. A competência de referência passa a exibir **Realizado × Meta × Projeção**, confiança da projeção por maturidade dos dias úteis, comparação com o mesmo corte da competência anterior, alertas automáticos e técnicos com maior risco de não fechamento das metas.

O novo módulo `js/predictive-engine.js` concentra as regras puras de projeção, comparação, classificação de risco e geração de alertas, com testes próprios. A projeção de volume usa o ritmo médio por dia útil; a taxa de avaliação permanece como tendência da taxa observada, sem inventar crescimento futuro.

## V2.36.0 — Central de Importação

A V2.36.0 adiciona uma camada de segurança ao fluxo de CSV. Antes de gravar, o sistema cria uma prévia por Squad, compara o arquivo com a competência atual e classifica riscos. Quedas relevantes, vínculos não reconhecidos, linhas inválidas, valores negativos e competências fechadas passam a ser sinalizados antes da confirmação.

A tela de Administração também ganhou histórico recente de importações, checksum do arquivo, registro no Supabase quando a migração V2.36.0 estiver aplicada e reversão controlada da última importação por até 30 minutos usando snapshot anterior. O módulo `js/import-engine.js` concentra as regras puras de prévia e validação e possui testes próprios.

> Para persistir o histórico entre navegadores, execute `supabase/migrations/MIGRACAO_V2.36.0.sql` no Supabase. Sem a migration, o sistema continua funcionando e mantém o histórico local do navegador.

## V2.35.1 — Estrutura e estabilidade

A V2.35.1 inicia a modularização do front-end sem alterar as regras de negócio. O novo `js/chart-engine.js` concentra preferências, escalas, geometria SVG, estilos de linha/ponto, rótulos e interação dos gráficos. O `app.js` passa a consumir esse núcleo em vez de manter primitivas duplicadas. A suíte automatizada também foi ampliada para validar o motor de gráficos e a estrutura de carregamento.

**Repositório:** `dashboard-squad-performance`<br>
**GitHub Pages:** `https://joseeduardopagnossim.github.io/dashboard-squad-performance/`

## Visão geral

O projeto é uma aplicação web estática em HTML, CSS e JavaScript, integrada ao Supabase para autenticação e persistência. A publicação pode ser feita diretamente pelo GitHub Pages, sem etapa de build.

Principais áreas da aplicação:

- desempenho individual e visão do Squad;
- indicadores por período e por dias úteis;
- qualidade de Serviço, Produto e Empresa;
- rankings e gamificação;
- metas, bonificação e comparação de modelos financeiros;
- custos gerais do Suporte;
- impacto financeiro da qualidade;
- feedbacks e histórico por técnico;
- administração de usuários, Squads e temas;
- importações operacionais em CSV e exportações em Excel/PDF.

## Estrutura do projeto

```text
dashboard-squad-performance/
├── assets/                 # imagens, favicon e trilhas
├── css/
│   └── styles.css          # estilos da aplicação
├── js/
│   ├── app.js              # lógica principal
│   ├── config.js           # configuração de ambiente/Supabase
│   ├── core-utils.js       # utilidades compartilhadas
│   ├── finance-rules.js    # regras financeiras puras e testáveis
│   ├── finance-advanced.js # memória, versão, simulador e explicações financeiras
│   ├── chart-engine.js     # motor visual dos gráficos
│   ├── import-engine.js    # prévia e segurança das importações
│   ├── predictive-engine.js# projeções e alertas
│   ├── settings-engine.js  # layouts e permissões
│   ├── tv-engine.js        # playlists, dispositivos e monitoramento de TV
│   ├── audit-utils.js      # sanitização e proteções da auditoria
│   ├── default-data.js     # dados demonstrativos anonimizados
│   └── demo-users.js       # contas exclusivamente demonstrativas
├── docs/
│   ├── architecture.md     # visão técnica
│   ├── database.md         # instalação e atualização do banco
│   ├── security.md         # cuidados de segurança
│   ├── demo.md             # modo de demonstração
│   ├── examples/           # exemplos de tema
│   └── releases/           # histórico detalhado por versão
├── tests/
│   ├── finance-rules.test.js # testes automáticos das regras financeiras
│   └── audit-utils.test.js   # testes das proteções de auditoria
├── .github/workflows/
│   └── quality.yml         # validação automática no GitHub Actions
├── supabase/
│   ├── functions/          # Edge Functions
│   ├── migrations/         # migrações históricas
│   ├── schema.sql          # instalador cumulativo para base nova
│   ├── bootstrap_primeiro_admin.sql
│   └── config.toml
├── CHANGELOG.md
├── index.html
└── README.md
```

## Executar localmente

A aplicação não exige Node.js ou processo de build. Para evitar limitações do navegador ao abrir arquivos diretamente, prefira um servidor HTTP local:

```bash
python -m http.server 8080
```

Depois acesse `http://localhost:8080`.

### Modo Supabase

O ambiente atual utiliza Supabase. A configuração fica em:

```text
js/config.js
```

A chave utilizada no frontend deve ser apenas **publishable/anon**. Nunca coloque `service_role` no navegador ou no repositório.

Para uma instalação nova do banco, siga [docs/database.md](docs/database.md).

### Modo demonstração

Para trabalhar sem banco, altere `mode` para `demo` em `js/config.js`. As contas e os dados deste modo são fictícios e anonimizados. Consulte [docs/demo.md](docs/demo.md).

## Validação e testes automáticos

O projeto possui um *quality gate* executável localmente e também pelo GitHub Actions. Com Node.js 20 ou superior:

```bash
npm ci
npm run check
```

O comando `npm run check` executa duas etapas:

1. `npm run validate` — confere referências locais, estrutura obrigatória, ordem de carregamento dos módulos e sintaxe dos JavaScripts;
2. `npm test` — executa os testes automáticos das regras financeiras e das proteções de auditoria com o test runner nativo do Node.js.

A suíte financeira cobre faixas de atendimento, faixas de Notas 5, cancelamento, regra 2 de 4 para status financeiro, empate de prêmios, desconto/redistribuição, competência parcial, piso zero, férias e teto global do modelo individual. Os testes de auditoria validam a confirmação digitada e a remoção de campos sensíveis antes do registro.

### GitHub Actions

O workflow `.github/workflows/quality.yml` roda automaticamente em:

- todo `push` na branch `main`;
- todo Pull Request direcionado para `main`;
- execução manual pela aba **Actions** do GitHub.

Se a validação ou qualquer teste falhar, o workflow fica vermelho e informa qual regra precisa ser revisada. Ele não altera o deploy do GitHub Pages; funciona apenas como barreira de qualidade.


## Auditoria e operações críticas

A V2.29.8 adiciona uma área **Gestão > Auditoria** para administradores. Os registros incluem ator, data/hora, escopo, ação e visão de antes/depois para mudanças administrativas relevantes. Na versão atual, Administradores visualizam a organização completa; Técnicos permanecem limitados ao próprio escopo. O antigo Admin de Squad foi descontinuado na V2.43.2.

São auditadas, entre outras, criação/alteração/inativação/exclusão de usuários, importações, fechamento/reabertura/exclusão de competência, metas, configurações financeiras, custos e parâmetros de impacto financeiro. Campos com nomes sensíveis como senha, token, secret e `service_role` são removidos do payload de auditoria do frontend.

Ações destrutivas selecionadas usam confirmação reforçada: **EXCLUIR** para exclusões e **REABRIR** para reabertura de competência.

Para atualizar uma base existente que já está na V2.29.8 para a V2.30.2:

1. faça backup do banco;
2. execute `supabase/migrations/MIGRACAO_V2.30.2.sql` no SQL Editor;
3. valide login, leitura dos Squads, gravação financeira e criação/edição de usuário;
4. publique o frontend normalmente.

A V2.30.2 torna explícitos os `GRANT`s usados pela Data API do Supabase e remove a dependência dos privilégios automáticos para as tabelas afetadas. Não é necessário republicar as Edge Functions apenas por esta migração.

## Publicação no GitHub Pages

O projeto continua preparado para publicação diretamente pela raiz do repositório. Os caminhos do frontend são relativos, portanto o endereço esperado é:

```text
https://joseeduardopagnossim.github.io/dashboard-squad-performance/
```

Após qualquer reorganização, publique `index.html`, `assets/`, `css/` e `js/` juntos para evitar referências quebradas.

## Banco de dados

- **Base nova:** execute `supabase/schema.sql`.
- **Base existente:** aplique somente as migrações pendentes de `supabase/migrations/`.
- **Primeiro administrador:** utilize `supabase/bootstrap_primeiro_admin.sql` após criar o usuário no Supabase Auth.
- **Edge Functions:** ficam em `supabase/functions/`.

Não execute o instalador cumulativo em uma base de produção apenas para atualizar versão. Veja [docs/database.md](docs/database.md).

## Segurança

A segurança da aplicação depende principalmente de autenticação, RLS e políticas do Supabase. Como o frontend é publicado no navegador, qualquer configuração cliente deve ser tratada como pública.

O projeto foi limpo para que os dados de demonstração não utilizem nomes ou credenciais reais. Mesmo assim, regras internas, fórmulas e lógica de negócio permanecem no código. Se essas informações forem confidenciais, mantenha o repositório privado e avalie a estratégia de publicação apropriada.

Mais detalhes em [docs/security.md](docs/security.md).

## Histórico de versões

O resumo das versões está em [CHANGELOG.md](CHANGELOG.md). As notas completas de cada atualização foram preservadas em [docs/releases/](docs/releases/).

## Manutenção

A estrutura foi organizada para permitir uma modularização gradual sem reescrever a aplicação. As utilidades genéricas já foram extraídas para `js/core-utils.js`; novas funcionalidades devem, sempre que possível, ser criadas em módulos específicos em vez de ampliar indefinidamente `js/app.js`.

> Projeto de uso interno da Soften Sistemas.


## Apresentação para TV — Etapa 2 (V2.32.0)

O módulo **Apresentação** agora replica as seis visões do monitor `app_ranking` usando os dados diários já armazenados no Performance Hub:

- Finalizados do Dia;
- Notas do Dia;
- Finalizados Geral;
- Notas Geral;
- Finalizados por Grupo;
- Notas por Grupo.

O carrossel alterna automaticamente a cada 20 segundos, preserva G6/Z4 e movimentação de posições entre a rodada atual e a anterior. Rankings de notas usam quantidade de avaliações como critério principal e média ponderada como desempate.

A URL direta permanece `?view=presentation`, com `&squad=A|B|D|E|all` opcional. Consulte `docs/APRESENTACAO_ETAPA2_V2.32.0.md`.

## Apresentação para TV (V2.31.0)

O Performance Hub possui um módulo **Apresentação** que reutiliza os dados já importados no dashboard. Não é necessário importar o mesmo CSV novamente em outro painel.

URL direta:

```text
?view=presentation
```

Administrador pode escolher um Squad específico ou todos:

```text
?view=presentation&squad=D
?view=presentation&squad=all
```

Nesta primeira etapa a URL utiliza a autenticação já existente. Se a sessão estiver salva no navegador da TV, o painel entra diretamente no modo apresentação. Consulte `docs/APRESENTACAO_ETAPA1_V2.31.0.md`.


## Apresentação para TV — Etapa 3 (V2.33.0)

A apresentação agora foi preparada para operação contínua em TV: carrossel com contador e progresso, fullscreen por botão/atalho, atualização automática a cada 5 minutos, atualização manual, Screen Wake Lock quando suportado e recuperação automática após queda de conexão sem apagar os últimos dados válidos.

Atalhos principais: `F` para fullscreen, `Espaço` para pausar/retomar o carrossel, setas para navegar e `R` para atualizar. Consulte `docs/APRESENTACAO_ETAPA3_V2.33.0.md`.


## Apresentação para TV — Etapa 4 (V2.34.0)

Administradores agora possuem um painel de configuração dentro de **Apresentação** para definir o Squad da TV, intervalo do carrossel, frequência de atualização, abas visíveis e sua ordem, layout em uma ou duas colunas, indicadores, G6/Z4 e filtros. As escolhas são incorporadas à URL da TV e também ficam salvas localmente. Consulte `docs/APRESENTACAO_ETAPA4_V2.34.0.md`.
