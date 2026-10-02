# Soften Performance Hub

![Quality Gate](https://github.com/JoseEduardoPagnossim/dashboard-squad-performance/actions/workflows/quality.yml/badge.svg)

Dashboard interno para acompanhamento de performance, qualidade, metas, gamificação, bonificação e indicadores dos Squads de Suporte da Soften Sistemas.

**Versão atual:** `2.38.1`<br>




## V2.38.1 — Centralização das configurações

A Central de Configurações agora é o único local para alterar regras e comportamento dos módulos. Metas/referências, regras da bonificação, aparência/gráficos e configuração da Apresentação/TV foram retiradas das telas operacionais e agrupadas por módulo, com busca, filtros e indicação visual do módulo em cada card.

As telas de **Operação**, **Bonificação** e **Apresentação** permanecem focadas em dados, conferência, fechamento e exibição. Elas mantêm atalhos contextuais para abrir diretamente o módulo correto dentro de Configurações.

A competência usada por metas e regras financeiras pode ser trocada dentro da própria Central de Configurações. Aparência continua permitindo aplicação somente no Squad atual ou em todos os Squads.

## V2.38.0 — Configurações e personalização

A V2.38.0 cria uma **Central de Configurações** disponível para todos os perfis. Cada usuário pode organizar os blocos principais das telas permitidas, escolher densidade compacta ou confortável e ocultar informações que não utiliza no dia a dia. A preferência é individual e pode ser sincronizada pelo Supabase com a migração da versão.

Também entra o novo `js/settings-engine.js`, responsável pelos layouts e pelas permissões granulares. O Admin Geral pode retirar permissões específicas de um usuário sem criar novos perfis, sempre respeitando o limite do papel base — overrides nunca elevam privilégios de `technician` ou `squad_admin`.

> Execute `supabase/migrations/MIGRACAO_V2.38.0.sql` para sincronizar layouts entre dispositivos e persistir as permissões específicas.

## V2.37.0 — Gestão preditiva

A V2.37.0 adiciona uma camada preditiva aos Indicadores do Admin Geral. A competência de referência passa a exibir **Realizado × Meta × Projeção**, confiança da projeção por maturidade dos dias úteis, comparação com o mesmo corte da competência anterior, alertas automáticos e técnicos com maior risco de não fechamento das metas.

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

A V2.29.8 adiciona uma área **Gestão > Auditoria** para administradores. Os registros incluem ator, data/hora, escopo, ação e visão de antes/depois para mudanças administrativas relevantes. Admin Geral visualiza a organização; Admin de Squad visualiza apenas seu próprio Squad por RLS.

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

Admin Geral pode escolher um Squad específico ou todos:

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
