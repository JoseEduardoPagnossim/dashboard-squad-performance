# Soften Performance Hub

Dashboard interno para acompanhamento de performance, qualidade, metas, gamificação, bonificação e indicadores dos Squads de Suporte da Soften Sistemas.

**Versão atual:** `2.29.6`<br>
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
│   ├── default-data.js     # dados demonstrativos anonimizados
│   └── demo-users.js       # contas exclusivamente demonstrativas
├── docs/
│   ├── architecture.md     # visão técnica
│   ├── database.md         # instalação e atualização do banco
│   ├── security.md         # cuidados de segurança
│   ├── demo.md             # modo de demonstração
│   ├── examples/           # exemplos de tema
│   └── releases/           # histórico detalhado por versão
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

## Validação rápida

Antes de publicar, execute:

```bash
node scripts/validate-project.mjs
```

O script confere os arquivos referenciados pelo `index.html` e valida a sintaxe dos JavaScripts locais.

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
