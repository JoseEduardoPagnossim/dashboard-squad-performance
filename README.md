# Soften Performance Hub

![Quality Gate](https://github.com/JoseEduardoPagnossim/dashboard-squad-performance/actions/workflows/quality.yml/badge.svg)

Dashboard interno para acompanhamento de performance, qualidade, metas, gamificação, bonificação e indicadores dos Squads de Suporte da Soften Sistemas.

**Versão atual:** `2.29.7`<br>
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
│   └── finance-rules.test.js # testes automáticos das regras financeiras
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
2. `npm test` — executa os testes automáticos das regras financeiras com o test runner nativo do Node.js.

A suíte financeira cobre faixas de atendimento, faixas de Notas 5, cancelamento, regra 2 de 4 para status financeiro, empate de prêmios, desconto/redistribuição, competência parcial, piso zero, férias e teto global do modelo individual.

### GitHub Actions

O workflow `.github/workflows/quality.yml` roda automaticamente em:

- todo `push` na branch `main`;
- todo Pull Request direcionado para `main`;
- execução manual pela aba **Actions** do GitHub.

Se a validação ou qualquer teste falhar, o workflow fica vermelho e informa qual regra precisa ser revisada. Ele não altera o deploy do GitHub Pages; funciona apenas como barreira de qualidade.

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
