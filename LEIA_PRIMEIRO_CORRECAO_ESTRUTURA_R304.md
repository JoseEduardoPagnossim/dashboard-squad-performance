# R30.4 - Correção da pasta duplicada

## Diagnóstico do ZIP recebido

O arquivo enviado continha dois níveis:

- `dashboard-squad-performance/index.html` e `js/app.js`: versão R30.3.
- `dashboard-squad-performance/dashboard-squad-performance/index.html` e `js/app.js`: versão R30.4.

Assim a publicação realizada a partir da raiz enviava arquivos antigos. Este pacote tem SOMENTE uma raiz: `index.html`, `js/`, `css/`, `tests/` etc.

## Instalação com segurança (Windows / VS Code)

1. Faça uma cópia de segurança da pasta local inteira, inclusive `.git`.
2. Abra a pasta do repositório no VS Code (a que contém `.git` e `package.json`).
3. Extraia o ZIP corrigido em uma pasta TEMPORÁRIA. Ele já começa com `index.html`, `js/`, `css/`, etc.; não há uma pasta `dashboard-squad-performance` envolvendo tudo.
4. Copie todo o conteúdo da extração para a RAIZ do repositório, mesclando pastas e substituindo arquivos iguais. O ZIP não contém `.git` e não altera seu histórico.
5. Confirme que o `index.html` na raiz contém `individualLowRatings` e que `js/app.js` contém `renderIndividualLowRatings`.
6. Só depois de confirmar o sucesso, remova a pasta DUPLICADA `dashboard-squad-performance` que existe DENTRO da raiz. Não exclua a pasta principal que contém `.git`.
7. No terminal aberto na raiz execute `npm run check`.
8. Execute `git status`, `git add -A`, `git commit -m "fix: corrige pasta duplicada e publica R30.4"`, `git pull --rebase origin main`, `git push origin main` (se houver conflito, pare antes do push).
9. Confirme o Quality Gate verde no Actions; abra o site e atualize com Ctrl+Shift+R.

Nenhuma migration SQL é necessária para esta correção. A pasta `.git` do repositório local deve ser preservada.

## Resultado da verificação neste pacote

`npm run check`: 1187 testes passaram, 0 falharam. `package.json` define `assetVersion: 2.63.9-r304`.
