# Hotfix V2.63.9 R2 — Layout da Automação e prévia CSV

## Problema reproduzido

A regra global `.strategy-panel` usa duas colunas (aproximadamente 67%/33%). A tela **Automação** possui vários cartões em sequência e herdava indevidamente esse grid. O cartão da central ocupava a primeira coluna, o importador CSV ficava espremido na segunda, e o primeiro cartão era esticado até a altura da prévia, deixando um grande espaço vazio. As tabelas não tinham um contêiner com rolagem horizontal controlada, causando corte lateral e barra de rolagem na página inteira.

## Correção

- Grid exclusivo de uma coluna para `[data-strategy-panel="automation"]`, sem alterar a distribuição dos outros painéis.
- Cartões ocupam toda a largura útil, sem estiramento na direção vertical.
- Tabelas do importador (prévia, produtos, catálogo e demais conferências) têm scroll horizontal **dentro do cartão**, sem expandir o documento.
- Mantidos parser, mapeamento, identificação de produtos, conciliação, regras de MRR, comissões, deduplicação e fechamento. Nenhum dado financeiro é modificado.
- Atualizado cache-buster uniforme para `2.63.9-r2` em todos os arquivos CSS/JS do HTML e respectivas asserções de testes.

## Instalação

1. Extrair ZIP incremental sobre a **V2.63.9** (ou aplicar o patch na raiz do repositório com `patch -p1`).
2. Executar `npm run check` e publicar no GitHub Pages.
3. Reabrir **Gestão Estratégica > Automação** e usar `Ctrl+Shift+R` para carregar o CSS novo.
4. Conferir a prévia em desktop e móvel: blocos empilhados na largura correta e tabelas rolando dentro dos cartões.

Não requer migration SQL, republicação de Edge Functions ou reimportação de arquivos CSV.

## Controle de qualidade

- Testes de regressão de CSS verificam que **somente** Automação recebe uma coluna.
- Testes de layout em Chromium verificam largura dos cartões, ausência de overflow horizontal externo, scroll interno da prévia e comportamento responsivo.
- `npm run check` inclui toda a suíte e a auditoria da Fase 8.
