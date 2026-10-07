## V2.48.6 — Hotfix de overflow horizontal e integridade do Design System

- Corrige regressão em que os selects-fonte invisíveis de Squad, mês, técnico e outros filtros herdavam `width:100%!important` de regras legadas.
- Elimina o crescimento indevido do documento e o scroll horizontal global que fazia a sidebar parecer desaparecer.
- Reforça a ocultação do select nativo com seletor de maior especificidade, largura mínima/máxima de 1px e contenção de layout.
- Mantém o proxy visual do Design System sem mover o select original e sem alterar listeners de negócio.
- Adiciona validação de integridade horizontal para desktop e breakpoints responsivos.
- Sem migration de banco.

## V2.48.5 — Correção de regressões dos controles e navegação

- Corrige a regressão da V2.48.4 que reparentava todos os `<select>` e podia quebrar filtros dependentes como Squad, competência, técnico, grupos e selects dinâmicos.
- O `<select>` original permanece no mesmo ponto do DOM e continua sendo a fonte de verdade; o Design System usa um proxy visual irmão, sem alterar listeners ou estrutura esperada pela aplicação.
- O menu de opções passa a abrir em portal fixo no `body`, evitando corte por `overflow` em topbar, cards, tabelas e modais.
- Remove hooks globais em `HTMLSelectElement.prototype`; sincronização passa a ser local, por MutationObserver e verificação leve de estado.
- Mantém sincronização quando opções são reconstruídas via `innerHTML`, quando o valor é alterado por JavaScript, quando o campo é desabilitado e quando selects são adicionados/removidos dinamicamente.
- Faz recuperação única das preferências de navegação antigas para reabrir grupos/subgrupos da sidebar após a regressão, preservando apenas o estado de sidebar inteira recolhida.
- Mantém search, number, date/month/datetime-local, color, checkbox/radio, range, file, textarea e demais inputs dentro do Design System.
- Sem migration de banco.
- Suíte automatizada: **201/201 testes aprovados**; smoke visual/funcional adicional validou selects dependentes e todos os tipos de controle no Chromium.

## V2.48.4 — Design System completo nos campos + sidebar estabilizada

- Corrige regressão estrutural da sidebar com grid vertical único e scroll restrito à navegação.
- Mantém campanha, player e versão acessíveis em desktop mesmo com zoom/altura reduzida.
- Padroniza visualmente todos os tipos de campo usados no sistema.
- Remove aparência nativa de `search`, spinners de `number`, seta nativa de `select` e indicadores nativos visíveis de data.
- Date/month/datetime-local recebem acionador visual do Design System mantendo o picker do navegador apenas como mecanismo interno.
- Inputs de cor viram fonte oculta e passam a ser acionados por swatch próprio.
- Todos os `input[type=file]` permanecem ocultos e acessíveis somente por botões do sistema.
- Design System passa a classificar também controles adicionados dinamicamente.
- Sem migration de banco.

## V2.48.3 — Tipografia configurável, controles padronizados e salvamento explícito

- Adiciona fonte do sistema por tema com três opções: Inter, Roboto e Source Sans 3.
- A fonte passa a ser aplicada à interface completa e acompanhada pelo JSON do tema.
- Padroniza selects, checkboxes, radios, ranges, campos temporais, cores e upload visual no Design System.
- Substitui o upload nativo visível do fundo por botão + status de arquivo.
- Personalização de tema passa a operar em rascunho: preview imediato, mas persistência apenas ao clicar em **Salvar tema**.
- Cancelar/fechar o modal restaura o tema anterior sem gravar alterações.
- Mantém botões de salvamento já existentes nas configurações de gráficos, layout, metas, financeiro, custos, apresentação e usuários.
- Inclui MIGRACAO_V2.48.3.sql somente para expor `fontFamily` na identidade visual pública do boot/login; nenhuma tabela nova é criada.

## V2.48.2 — Tema persistente no boot/login e carregamento sem flicker

- Remove o fallback visual imediato para **Brasil em Campo** quando o navegador está sem cache local.
- Adiciona identidade neutra da Soften enquanto o tema persistido ainda está sendo resolvido.
- Adiciona RPC pública sanitizada `get_public_theme_bootstrap` para recuperar somente identidade visual antes do login.
- Mantém `squad_themes` protegido por RLS e sem `SELECT` anônimo direto.
- Aguarda o tema exato do Squad antes de liberar a interface autenticada.
- Remove imagens de futebol hardcoded do boot, boas-vindas de áudio e campanha inicial.
- Exige `MIGRACAO_V2.48.2.sql`.
- Suíte automatizada: **187/187 testes aprovados**.

## V2.48.1 — Sidebar responsiva em zoom e viewport reduzida

- Corrige desaparecimento progressivo da campanha, player e versão em 100% de zoom/viewport baixa.
- Transforma `sidebar-nav` na única área rolável da sidebar desktop.
- Preserva cabeçalho, campanha e rodapé fora do scroll da navegação.
- Mantém a campanha visível e compacta abaixo de 900 px e 760 px de altura.
- Respeita `100dvh` e evita overflow horizontal.
- Não exige migration de banco.

## V2.48.0 — Visões salvas, filtros persistentes e favoritos

- Adiciona estrela de favorito e painel pessoal de **Visões** no cabeçalho.
- Permite salvar a visão atual com nome, rota e filtros aplicáveis.
- Permite abrir, renomear, excluir e favoritar visões salvas.
- Integra favoritos e visões salvas à busca global `Ctrl+K`.
- Lembra Squad, competência, técnico e período por contexto de tela.
- URLs explícitas e visões salvas têm prioridade sobre filtros lembrados.
- Reutiliza `profiles.ui_preferences`/`save_my_ui_preferences`; não cria tabela nova.
- Inclui `js/workspace-engine.js` e testes dedicados.
- Sem migration de banco.
- Suíte automatizada: **180/180 testes aprovados**.

## V2.47.1 — Correção da importação Produto/Empresa com DataAvaliacao

- Corrige a Central de Importação de qualidade, que ainda exigia literalmente a coluna `Time`.
- Passa a aceitar `DataAvaliacao`, `Data Avaliação`, `Data da Avaliação`, `Time` ou `Data` como coluna de data.
- Mantém `nomeApresentativo` e adiciona aliases seguros `Técnico`, `Tecnico` e `Atendente`.
- Mantém `NotaProduto` e `NotaEmpresa` obrigatórias; `NotaServico` continua ignorada na importação de Produto/Empresa.
- Melhora a mensagem de erro exibindo aliases aceitos e cabeçalhos realmente encontrados.
- Validação feita também contra o CSV real de setembro enviado para diagnóstico: 1.706 linhas de dados reconhecidas.
- Sem migration de banco.
- Suíte automatizada: **167/167 testes aprovados**.

## V2.47.0 — Busca global, breadcrumbs e URLs persistentes

- Adiciona busca global com `Ctrl+K` / `Cmd+K` e navegação completa por teclado.
- Indexa telas, seções de Indicadores, módulos de Configurações, Squads e técnicos disponíveis no contexto carregado.
- Filtra resultados conforme perfil e permissões efetivas.
- Adiciona breadcrumbs derivados da mesma rota usada pela navegação.
- Persiste página, seção, módulo, Squad, competência, técnico e período na URL quando aplicável.
- Integra `pushState`, `replaceState` e `popstate` para suportar links compartilháveis e Voltar/Avançar.
- Separa a rota normal `page=presentation` do modo TV `view=presentation`.
- Cria `js/navigation-engine.js` e testes dedicados de normalização, URL e busca.
- Não exige migration de banco.
- Suíte automatizada: **164/164 testes aprovados**.

## V2.46.0 — Central de Alertas + notificações internas

- Adiciona sino global com contador de itens não lidos e popover de notificações recentes.
- Cria a Central de Alertas com KPIs, filtros, busca e ações contextuais.
- Reaproveita sinais operacionais existentes para alertas automáticos de performance e cobertura.
- Permite a Administradores publicar notificações para Todos, Administradores, Técnicos ou Squad específico.
- Adiciona prioridade, categoria, agendamento, expiração e destino opcional de ação.
- Persiste leitura individual no Supabase e mantém leitura local para alertas automáticos.
- Inclui gestão das notificações publicadas e encerramento sem exclusão histórica.
- Adiciona auditoria para publicação/encerramento e permissões `notifications.view`/`notifications.manage`.
- Inclui `MIGRACAO_V2.46.0.sql` com RLS por organização, perfil e Squad.

## V2.45.2 — Filtros superiores e CSV deduplicado

- Centraliza a visibilidade dos filtros superiores para evitar divergência entre `showView()` e `applyPermissions()`.
- Exibe o filtro de período na Apresentação e remove controles sem efeito em módulos que não consomem Squad/Mês/período.
- Oculta Squad em **Indicadores > Impacto financeiro**, que é corporativo para o Suporte técnico completo.
- Corrige importação do CSV deduplicado com aliases de cabeçalho (`Time`, `Data Avaliação`, `Nota Atendimento`, entre outros).
- Reconhece e ignora a diretiva `sep=;` adicionada por algumas exportações do Excel.
- Mantém as quatro dimensões obrigatórias e melhora a mensagem de erro com aliases aceitos e cabeçalhos encontrados.
- Sem migration de banco.
- Suíte automatizada: **144/144 testes aprovados**.

## V2.45.1 — Correção da grade da Home e espaçamento

- Corrige conflito entre `.personal-layout-root` e `.home-widget-grid` que forçava `display:flex` e ignorava os tamanhos dos widgets.
- Mantém a Home em grade de 12 colunas com largura total do container e responsividade existente.
- Corrige persistência visual de widgets ocultos após Salvar/Cancelar; durante a edição eles permanecem visíveis de forma atenuada para poderem ser reativados.
- Amplia o mapeamento de espaçamento para Home, históricos, cabeçalhos e barras de configuração usando `--ds-card-gap`.
- Sem migration e sem alteração de cálculos, metas ou regras financeiras.

## V2.45.0 — Home modular e ritmo visual
- Corrige padding interno ausente em cards herdados que não possuíam espaçamento próprio.
- Padroniza gaps dos grids afetados sem alterar cards que já tinham padding específico.
- Adiciona Home modular em grade de 12 colunas.
- Permite reorganizar widgets por drag-and-drop.
- Permite ocultar/exibir widgets e escolher tamanhos compatíveis por bloco.
- Mantém controles de subir/descer em Configurações como alternativa ao arraste.
- Salva ordem, visibilidade e tamanhos dentro de `ui_preferences` por usuário.
- Mantém comportamento responsivo e oculta widgets não aplicáveis ao perfil Técnico.
- Não exige migration de banco.
- Suíte automatizada da versão: **134/134 testes aprovados**.

## V2.44.0 — Design System e padronização visual
- Cria `css/design-system.css` como camada visual central e temática.
- Cria `js/design-system.js` para classificação semântica de cards e tabelas.
- Padroniza tipografia, espaçamento, raios, sombras, controles e estados de interação.
- Diferencia visualmente cards de KPI, análise, configuração e informação.
- Melhora tabelas com cabeçalho fixo, zebra sutil, números tabulares, primeira coluna fixa em grades largas e densidade automática.
- Integra a preferência de densidade do usuário ao novo sistema visual.
- Mantém temas, gráficos, TV, regras de negócio, permissões e performance sem mudanças funcionais.
- Não exige migration de banco.
- Suíte automatizada da versão: **129/129 testes aprovados**.

## V2.43.2 — Simplificação de perfis e permissões
- Remove Admin de Squad dos fluxos ativos da interface, mantendo apenas Administrador e Técnico.
- Administradores passam a ter acesso integral a todos os Squads e módulos, sem restrições individuais por `permissions`.
- Restrições específicas continuam disponíveis somente para Técnicos e nunca elevam privilégios.
- Cadastro, edição, filtros, Home, ajuda e matriz de permissões foram atualizados para o modelo de dois perfis.
- Edge Functions `create-user` e `manage-user` deixam de criar `squad_admin` e passam a gerenciar Administradores globalmente.
- Inclui `MIGRACAO_V2.43.2.sql`, que converte registros legados `squad_admin` para `super_admin` e reforça `can_admin_squad()` para Administradores globais.
- Mantém o valor legado no schema histórico apenas para compatibilidade com migrations antigas.
- Atualiza documentação, demo e testes estruturais para o modelo atual.
- Suíte automatizada da versão: **122/122 testes aprovados**.

## V2.43.1 — Métricas de performance e ajustes finos
- Mede o login completo, incluindo autenticação, até a interface utilizável.
- Registra tempos de carregamento por módulo e por competência.
- Adiciona contadores de cache hit/miss/stale/write e long tasks do navegador.
- Captura erros de runtime e promises rejeitadas com payload sanitizado.
- Envia telemetria em lote, de forma assíncrona e fora do caminho crítico do login.
- Cria `Configurações → Performance` para Admin Geral com média, P95, erros e módulos mais lentos.
- Adiciona exportação JSON do diagnóstico para análise pontual.
- Inclui `MIGRACAO_V2.43.1.sql` com tabela de eventos e RPCs seguras de gravação/resumo.
- Mantém fallback local quando a migration ainda não foi aplicada.
- Amplia a suíte automatizada para **118 testes**.

## V2.43.0 — Performance e carregamento progressivo
- Substitui o carregamento monolítico pós-login por contexto inicial enxuto e hidratação progressiva.
- Adiciona RPC `get_initial_dashboard_context()` para perfil, Squads, índice de competências e resumo do período atual.
- Implementa lazy loading de competências completas somente quando a tela exige detalhes.
- Paraleliza consultas independentes e deduplica requisições concorrentes da mesma competência.
- Adiciona cache de sessão para contexto inicial, meses completos e temas, com invalidação após gravações relevantes.
- Carrega consolidados organizacionais e comissões de Admin Geral somente quando necessários.
- Adiciona indicador não bloqueante de carregamento sob demanda.
- Expõe diagnóstico de tempo de login em `window.SoftenPerformanceDiagnostics`.
- Adiciona índices de banco para período e métricas diárias via `MIGRACAO_V2.43.0.sql`.
- Ajusta carregamento de assets: áudio sem preload e remoção de arquivos históricos sem uso em runtime.
- Mantém fallback otimizado quando a migration V2.43 ainda não estiver instalada.
- Amplia a suíte para **110 testes automatizados**.

## V2.42.0 — Navegação retrátil e avatar
- Adiciona sidebar retrátil no desktop, com modo compacto de ícones e tooltips.
- Torna Desempenho, Gestão e Conta recolhíveis e cria submódulos Financeiro, Pessoas e Governança.
- Salva o estado da navegação por usuário dentro de `ui_preferences`, com fallback local.
- Adiciona avatar em Meu perfil com recorte quadrado, conversão WebP e limite seguro antes do upload.
- Usa bucket privado `user-avatars` e grava somente `avatar_path` em `profiles`.
- Exibe avatar no topo, Home e Meu perfil, mantendo iniciais como fallback e sem carregar fotos na listagem administrativa.
- Inclui `MIGRACAO_V2.42.0.sql` com bucket, RLS e RPC de atualização do próprio avatar.
- Atualiza Como usar e documentação da arquitetura.

## V2.41.0 — Experiência inicial e Home
- Redesenha a tela de login com a logo oficial da Soften, hierarquia visual mais clara e comportamento responsivo.
- Padroniza proporções de cards, campos e botões para reduzir diferenças visuais entre módulos.
- Cria o módulo **Início** e o define como primeira tela após o login.
- A Home se adapta ao perfil: Técnico, Admin de Squad e Admin Geral recebem KPIs, alertas e atalhos adequados ao próprio contexto.
- Admin Geral recebe visão resumida dos Squads e acesso rápido ao comparativo consolidado.
- Substitui estados vazios silenciosos por mensagens orientativas e ações para importar dados, consultar ajuda ou navegar para o próximo passo.
- Atualiza o guia **Como usar** com o novo fluxo de entrada pelo módulo Início.
- Não altera regras de negócio, autenticação, persistência financeira ou estrutura do banco e não exige migration nova.
- Amplia a suíte para **96 testes automatizados**.

## V2.40.1 — Como usar atualizado
- Reescreve o guia interno para refletir todas as áreas do painel atual.
- Adiciona busca textual dentro do Como usar e contador de tópicos encontrados.
- Adiciona atalhos contextuais para Meu desempenho, Visão do Squad, Indicadores, Apresentação, Operação, Bonificação, Configurações e Meu perfil.
- Adiciona mapa dos módulos com objetivo, momento de uso e acesso direto.
- Documenta Central de Importação, Operação/metas, gestão preditiva, Financeiro avançado, Central de Configurações, TV/Comunicação, usuários/permissões e feedbacks.
- Atualiza a matriz de permissões para o modelo granular da V2.38+.
- Explica playlists, URL fixa de TV, heartbeat e estados Online/Atenção/Offline.
- Mantém o conteúdo sensível ao perfil e às permissões do usuário conectado.
- Não exige migration nova e amplia a suíte para **90 testes automatizados**.

## V2.40.0 — TV / Comunicação
- Playlists nomeadas para reutilizar configurações de apresentação.
- Cadastro de múltiplas TVs com URL dinâmica por dispositivo.
- Monitoramento por heartbeat: online, atenção, offline, última sincronização, tela atual e resolução.
- Alterações em playlists são recarregadas pelas TVs cadastradas durante a sincronização automática.
- Persistência compartilhada no Supabase com RLS, RPC de configuração por dispositivo e heartbeat restrito à telemetria.
- Fallback local preserva a operação em ambiente demo ou antes da migration.
- Amplia a suíte automatizada para **86 testes**, incluindo motor de TV, URLs dinâmicas, heartbeat, status e estrutura da migration.

## V2.39.0 — Financeiro avançado

- adiciona versão explícita do motor financeiro (`FR-2.39.0-1`) em cada cálculo;
- cria assinatura determinística das regras e parâmetros da competência;
- adiciona memória de cálculo com fotografia das configurações, modelo, valores por técnico e total da folha;
- registra memórias automaticamente ao salvar regras, ajustes individuais, copiar regras e fechar a competência;
- adiciona registro manual de memória para auditorias pontuais;
- cria simulador por técnico sem alterar ou persistir dados oficiais;
- simulador recalcula Base do Squad, status, prêmios, redistribuição, férias e teto sobre uma cópia da competência;
- adiciona explicação completa, passo a passo, da bonificação no painel do técnico e na administração;
- fechamento passa a congelar versão e assinatura das regras;
- relatórios Excel/PDF passam a identificar versão e assinatura do cálculo;
- nova tabela imutável `finance_calculation_memory` via `MIGRACAO_V2.39.0.sql`;
- fallback local mantém o histórico disponível no navegador quando a migration ainda não foi executada;
- adiciona `js/finance-advanced.js` e amplia a suíte automatizada para 77 testes.

## V2.38.1 — Centralização das configurações

- transforma **Configurações** no ponto único para regras e comportamento dos módulos;
- move **Metas do Squad** e referências de pontuação para `Configurações > Operação e metas`;
- move modelo financeiro, faixas, cancelamento, prêmios, descontos e teto para `Configurações > Bonificação`;
- move tema, aplicação por Squad/todos os Squads e preferências dos gráficos para `Configurações > Aparência e gráficos`;
- move toda a configuração da TV/carrossel para `Configurações > Apresentação / TV`;
- mantém telas de Operação, Bonificação e Apresentação focadas em dados, conferência e execução;
- adiciona busca de configurações, filtros por módulo e seletor de competência dentro da Central;
- inclui identificação visual **MÓDULO:** em cada card centralizado e atalhos contextuais a partir das telas operacionais;
- preserva Usuários/Permissões como gestão de entidade, mantendo o resumo de governança dentro da Central;
- amplia a suíte para **66 testes automatizados**.

## V2.38.0 — Configurações e personalização

- nova Central de Configurações acessível a todos os perfis;
- layout individual com ordem, visibilidade e densidade dos principais blocos de Meu desempenho, Visão do Squad e Indicadores;
- preferências salvas localmente e sincronizáveis pelo Supabase;
- novo motor `js/settings-engine.js` para layouts e matriz de permissões;
- permissões granulares restritivas por usuário, sem ultrapassar o limite do papel base;
- Admin Geral passa a editar permissões específicas no cadastro de usuário;
- navegação e principais ações administrativas passam a respeitar as permissões efetivas;
- Edge Functions de usuários passam a validar a permissão `users.manage`;
- nova migração V2.38.0 com `profiles.permissions`, `profiles.ui_preferences` e RPC de preferências pessoais;
- suíte automatizada ampliada com testes de permissões e layouts.

## V2.37.0 — Gestão preditiva

- Realizado × Meta × Projeção para atendimentos, notas 5 e % de avaliação.
- Projeção por ritmo de dias úteis e indicador de confiança (baixa, média ou alta).
- Comparação com a competência anterior usando o mesmo corte de dias úteis.
- Alertas automáticos de risco, desaceleração, gap de avaliação e concentração de técnicos em atenção.
- Visão por Squad com status preditivo e tabela dos técnicos com maiores sinais de risco.
- Novo motor `js/predictive-engine.js` testável e desacoplado do `app.js`.
- Suíte ampliada com testes de projeção, comparação, risco e estrutura.

## V2.36.0 — Central de Importação

- nova Central de Importação em Administração;
- prévia por competência antes da gravação;
- comparação Atual x Novo por Squad;
- validações para mês fechado, valores negativos, linhas ignoradas, vínculos não encontrados/ambíguos e quedas relevantes;
- confirmação reforçada com a palavra `IMPORTAR` quando existem alertas;
- checksum simples do arquivo para rastreabilidade;
- histórico recente com tipo, competência, arquivo, escopo, risco e status;
- snapshot de segurança das competências tocadas;
- restauração automática do snapshot se uma importação falhar no meio da gravação;
- reversão da última importação concluída por até 30 minutos, bloqueada se uma competência afetada tiver sido fechada;
- persistência opcional do histórico no Supabase via `import_batches`;
- novo `js/import-engine.js` com regras testáveis de prévia e validação;
- suíte ampliada para 49 testes automatizados.

## V2.35.1 — Estrutura e estabilidade

- criado `js/chart-engine.js` como núcleo único das regras visuais e geométricas dos gráficos;
- preferências de gráficos, escala percentual, altura, espessura, pontos e densidade de rótulos agora passam pelo mesmo motor;
- primitivas SVG e interações de tooltip/legenda foram removidas do `app.js` e centralizadas no motor;
- `app.js` reduzido de 3.082 para 2.937 linhas sem remover funcionalidades;
- adicionados testes de `chart-engine` e testes de arquitetura/ordem de carregamento;
- validador do projeto passou a exigir o motor central e impedir duplicação das primitivas principais no `app.js`;
- suíte automatizada ampliada para 40 testes.

## V2.34.8 — Gráficos padronizados, aparência multi-Squad e férias na comissão-base

- Padroniza os gráficos legados (diário e histórico) para respeitar densidade de rótulos, fonte, altura, espessura de linha e tamanho dos pontos.
- Remove conflitos de altura fixa dos gráficos de qualidade em telas menores, preservando apenas limites responsivos de segurança.
- Persiste `chartPreferences` no JSON do tema e no Supabase.
- Admin Geral pode escolher aplicar a aparência somente ao Squad atual ou replicar para todos os Squads A/B/D/E.
- Corrige férias na bonificação: o redutor de 50% passa a incidir somente sobre a comissão-base após o multiplicador de cancelamento; bônus, prêmios, vendas, desconto e redistribuição ficam integrais.
- Relatórios e detalhamento financeiro passam a exibir a base após férias e o ajuste correspondente.

## V2.34.7 — Logo na apresentação

- Adiciona a marca Soften no hero do módulo Apresentação e no modo TV direto.
- Logo se adapta às densidades compacta, normal e ampla.
- Mantém compatibilidade com o ajuste automático de resolução da TV.

## V2.34.5 — Rótulos de dados permanentes nos gráficos

- Exibe os valores diretamente sobre pontos, linhas e barras, sem depender de hover.
- Mantém tooltip interativo como complemento.
- Adiciona posicionamento alternado e tamanho compacto para reduzir sobreposição em gráficos com várias séries.
- Aplica rótulos ao gráfico diário, históricos, indicadores, qualidade e gráficos em tela cheia.
- Preserva formatação de percentual, moeda e números conforme cada métrica.

# V2.34.5

- Apresentação em TV passa a usar encaixe automático baseado na área útil da tela, com referência 16:9 de 1920x1080.
- Modo direto bloqueia barras de rolagem e recalcula a escala ao redimensionar, entrar/sair do fullscreen ou alterar o conteúdo.
- Novas opções administrativas: Ajuste à tela, Escala, Densidade e Margem de segurança.
- Escala pode ser automática ou ajustada entre 75% e 110% como multiplicador do encaixe calculado.
- Densidade automática escolhe Compacta, Normal ou Ampla conforme resolução e volume de linhas.
- URLs da TV carregam fit, scale, density e safe, permitindo configuração diferente por televisão.
- Mantidos carrossel, atualização automática, tolerância a queda de conexão e preferências existentes.

# V2.34.3

- Padroniza dimensoes de todos os filtros do cabecalho para impedir reflow ao alternar Squad, mes, tecnico, datas e atalhos de periodo.
- Squad, mes, tecnico, datas, presets, tema e usuario passam a ocupar caixas estaveis no desktop.
- Filtros do painel Indicadores recebem grade previsivel e deixam de variar conforme o conteudo.
- Breakpoints de zoom/tablet/celular reorganizam os controles sem recalcular suas larguras pelo texto selecionado.

# V2.34.2

- Corrigida a largura do filtro de Squad no topo para permanecer fixa ao alternar entre Todos os Squads e Squads individuais.
- Mantida largura adaptada no breakpoint responsivo, evitando deslocamento dos controles em zoom alto.

- Sidebar passa para drawer responsivo em viewport estreita/zoom, com backdrop, fechamento por ESC e botão sempre acessível.
- Breakpoint ampliado para 980 px para evitar desaparecimento da navegação ao aumentar o zoom.
- Tela Indicadores reorganizada para tablet/celular: filtros, abas, KPIs, gráficos, cabeçalhos e ações empilham sem estourar a viewport.
- Tabelas e matrizes largas mantêm rolagem horizontal controlada no celular.
- Nenhuma regra de cálculo ou persistência foi alterada.

## V2.34.0 — Apresentação (Etapa 4: Administração)

- Adicionada área administrativa no módulo Apresentação.
- Configuração de Squad da TV, intervalo do carrossel e frequência de atualização.
- Seleção e reordenação das seis abas do ranking.
- Preferências de indicadores, G6/Z4, filtros e número de colunas.
- URL da TV passa a carregar as preferências de forma autocontida.
- Preferências administrativas também ficam salvas no navegador.
- Botões para copiar a URL configurada e abrir a TV diretamente.
- Mantida compatibilidade com URLs de apresentação das versões anteriores.
- Versão atualizada para 2.34.0.

## V2.33.0 — Apresentação (Etapa 3: TV contínua)

- Carrossel de 20s com barra de progresso e contador regressivo.
- Fullscreen por botão, duplo clique e tecla `F`.
- Atalhos de teclado para carrossel, navegação e atualização.
- Atualização automática dos dados a cada 5 minutos e botão de atualização manual.
- Recuperação automática quando a conexão volta, com retentativa em 1 minuto durante falhas.
- Últimos dados válidos permanecem na tela se a internet ou o Supabase ficarem indisponíveis.
- Indicador visual de Online / Sincronizando / Sem conexão / Atenção.
- Screen Wake Lock no modo TV quando suportado pelo navegador.
- Versão atualizada para 2.33.0.

## V2.32.0 — Apresentação (Etapa 2: Ranking completo)

- Porta as seis visualizações do `app_ranking` para o módulo Apresentação.
- Reproduz os cálculos de ranking diário, acumulado, notas e grupos.
- Mantém critérios de desempate do monitor original.
- Adiciona G6, Z4 e movimentação de posições.
- Adiciona carrossel automático de 20 segundos e pausa temporária após troca manual de aba.
- Mantém URL direta por Squad ou consolidada em `squad=all`.
- Usa exclusivamente o histórico diário já salvo no Performance Hub; não exige nova importação de CSV.

## V2.30.3

- Corrige o tema público exibido antes da autenticação: login e carregamento agora usam Brasil em Campo como fallback nativo.
- Remove o flash visual do dragão no primeiro carregamento ao trocar o `--hero-img` padrão do CSS e os `src` estáticos para a arte pública brasileira.
- Mantém temas personalizados por Squad após o login; o fallback público só é usado quando ainda não há tema autenticado/cache disponível.
- Mantém o preset Vermithor disponível de forma explícita, sem torná-lo novamente o tema padrão da aplicação.

## V2.30.2

- Corrige superfícies visuais que ainda podiam exibir a arte Vermithor em cards e previews.
- Hero, visão do Squad, ajuda, perfil, preview de aparência, login, carregamento e ambientação passam a receber a imagem do tema localmente.
- Squads ainda salvos com o tema legado Vermithor herdam a última identidade personalizada conhecida, evitando o retorno do dragão ao alternar entre Squads.
- O cache público deixa de ser sobrescrito por temas legados Vermithor.

## 2.30.2
- Corrige o Hero principal para exibir de forma visível a imagem configurada no tema.
- A visão "Todos os Squads" agora preserva o tema do último Squad selecionado, sem voltar ao Vermithor.
- Login e carregamento recuperam o último tema conhecido e, em atualizações, tentam também o tema salvo por Squad no cache local.
- O último Squad visualizado passa a ser lembrado para restaurar corretamente a identidade visual antes da autenticação.

# Changelog

## V2.30.0 — Tema unificado nas telas e artes da campanha

- A imagem definida em **Aparência > Imagem de fundo** passa a ser reutilizada no fundo principal, login, carregamento, boas-vindas da trilha e card lateral da campanha.
- Nome e frase da campanha passam a atualizar também o card lateral, a tela de carregamento e o título de boas-vindas da trilha.
- O último tema aplicado fica armazenado localmente para manter a identidade visual nas telas anteriores ao login. Em navegador novo, o tema padrão é usado até a primeira autenticação, quando o tema do Squad é carregado.
- Mantido fallback para os assets originais quando não existe fundo personalizado.


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

## V2.31.0 — Módulo Apresentação (Etapa 1)

- Adicionado o módulo **Apresentação** ao menu Desempenho.
- Criada URL direta para TV por `?view=presentation` e filtro opcional `squad`.
- Apresentação consome os mesmos dados já carregados no Performance Hub, sem nova importação de CSV.
- Adicionados indicadores de resumo e ranking inicial por atendimentos.
- Criado layout direto para TV sem sidebar/topbar.
- Adicionados atalhos de URL, nova tela e fullscreen.
- Separação inicial em `js/presentation.js` e `css/presentation.css` para suportar a evolução do carrossel na Etapa 2.
