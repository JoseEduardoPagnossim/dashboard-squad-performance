# V2.48.4 — Design System completo nos campos + sidebar estabilizada

## Objetivo
Eliminar qualquer aparência visual nativa do navegador nos campos do Performance Hub e tornar a barra lateral estruturalmente previsível em diferentes alturas, zoom e resoluções de desktop.

## Mapeamento dos controles
A revisão cobre todos os controles presentes no `index.html` e os controles adicionados dinamicamente:

- texto, e-mail e senha;
- pesquisa (`search`);
- números (`number`);
- `select`;
- `textarea`;
- datas, mês e data/hora;
- checkbox e radio;
- sliders (`range`);
- cores;
- uploads de arquivo.

### Regras
- `search` não exibe mais o X/lupa nativos do Chromium;
- `number` não exibe spinners nativos;
- `select` mantém o elemento HTML apenas como fonte de valor para a lógica existente; a interface usa trigger e lista de opções próprios do Design System, inclusive teclado e foco;
- date/month/datetime-local recebem botão de calendário do Design System; o seletor nativo continua sendo usado internamente apenas para escolher a data;
- checkbox, radio e range continuam com `appearance:none` e desenho do Design System;
- campos de cor usam um swatch próprio; o `input[type=color]` fica oculto como fonte funcional;
- inputs de arquivo permanecem invisíveis e são acionados somente por botões do sistema;
- campos criados dinamicamente também são classificados automaticamente pelo `design-system.js`.

## Sidebar
A sidebar de desktop passa a usar uma única grade vertical:

1. cabeçalho;
2. navegação com scroll próprio;
3. campanha;
4. player;
5. versão.

Somente a navegação pode crescer e rolar. Campanha, player e versão não são mais empurrados para fora da viewport por regras flex antigas. Em alturas menores a campanha é compactada, mas não removida.

## Banco de dados
Não exige migration. A alteração é exclusivamente de interface e Design System.
