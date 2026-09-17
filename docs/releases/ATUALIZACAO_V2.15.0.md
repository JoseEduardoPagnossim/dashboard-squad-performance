# Atualização V2.15.0

## Alterações

- Favicon de dragão padrão (`assets/favicon-dragon.png`).
- Favicon configurável por tema do Squad, com persistência no JSON de `squad_themes`.
- Importação/exportação de tema passa a preservar o favicon.
- README revisado para a versão atual.
- Tela **Como usar** revisada com Visão do Setor, consolidado diário, todos os técnicos, perfil/senha e permissões atuais.
- Gráficos históricos/consolidados responsivos e sem barra horizontal.
- Séries longas preservam todos os pontos e reduzem automaticamente apenas os rótulos do eixo X.
- Inputs `type=number` sem spinners nativos, com foco/hover modernos.

## Banco de dados

Não há nova migração SQL nesta versão. O favicon é salvo dentro do JSON de tema já existente.

## Atualização

Preserve o `js/config.js` configurado do ambiente atual. Substitua `index.html`, `js/app.js`, `css/styles.css`, `README.md`, `docs/examples/theme-ai-template.json` e publique `assets/favicon-dragon.png`.
