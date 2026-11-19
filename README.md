# Soften Performance Hub

Dashboard interno da Soften Sistemas para indicadores, Squads, metas, importacoes comerciais, bonificacao e auditoria financeira.

> **Versao da aplicacao:** `2.63.9` | **Revisao de assets:** consulte `assetVersion` em `package.json`. R30.4 inclui visualizacao de notas baixas no painel pessoal, status oficial e simulado distintos no ranking e ajustes de visibilidade do login.

## Estrutura do projeto

| Caminho | Finalidade |
| --- | --- |
| `index.html` | Entrada da aplicacao (GitHub Pages) |
| `js/`, `css/`, `assets/` | Aplicacao, estilos e recursos usados pelo site |
| `supabase/migrations/` | Migrations incrementais do banco; aplicar em ordem |
| `supabase/functions/` | Funcoes relacionadas ao backend |
| `tests/` | Testes automatizados e regressao financeira |
| `scripts/` | Auditoria de integridade e validacao do projeto |
| `docs/` | Documentacao de dominio, implantacao e historico |
| `docs/releases/legacy-root/` | Patches, instrucoes e logs historicos, **nao usados em producao** |
| `.github/workflows/` | Quality Gate no GitHub Actions |

## Ambiente e publicacao

A aplicacao e estatica e publicada pelo GitHub Pages. O backend de autenticacao e persistencia usa Supabase. Para uso em producao, configure `js/config.js` conforme o ambiente; nao inclua credenciais de service role no frontend. Verifique as politicas RLS ao publicar migrations.

1. Antes de modificar banco ou processamento financeiro, faca backup do Supabase.
2. Execute as migrations ainda pendentes **em ordem**, apenas apos revisar o SQL correspondente. A migration mais recente desta entrega e `MIGRACAO_V2.63.23_APARENCIA_INSTITUCIONAL_R302.sql`.
3. Publique os arquivos atualizados preservando os caminhos da aplicacao (`index.html`, `js/`, `css/`, `assets/`).
4. Atualize `assetVersion` em `package.json` quando alterar as referencias `?v=` do `index.html`; as versoes devem ser identicas.
5. Confira o GitHub Actions antes de considerar a publicacao concluida. No navegador, use `Ctrl+Shift+R` quando necessario.

### Validacao local

Requer Node.js conforme `engines` do `package.json`.

```bash
npm ci --ignore-scripts --no-audit --no-fund
npm run validate
npm test
```

O workflow `.github/workflows/quality.yml` executa as mesmas verificacoes a cada push em `main` e em pull requests. `exit code 1` indica falha; examine a primeira ocorrencia `not ok` ou `Falha` nos logs.

## Identidade visual (R30.2)

Em **Aparencia > Personalizar experiencia**, administradores podem definir uma **imagem institucional comum**. Essa imagem aparece no carregamento, na entrada e no fundo geral, sem substituir as imagens individuais dos Squads A/B/C/D/E. Use JPG/PNG/WEBP de ate 2 MB. O salvamento da imagem comum e independente do botao **Salvar tema** dos Squads e exige a migration R30.2. Sem imagem definida, o fundo e neutro.

A imagem comum destina-se a exibicao publica na entrada; **nao envie imagens confidenciais**. Nao existe leitura publica anonima das tabelas de usuarios ou comissoes. A RPC publica retorna somente a imagem institucional.

## Importacao comercial e auditoria (R29.2, R30, R30.1)

- A importacao MRR usa **somente `Vl Anterior`**. `Vl Atual Ativo` nao entra em calculos.
- Administradores recebem Squad financeiro pela competencia, sem precisar aparecer como tecnicos operacionais.
- Grupos candidatos a migracao/fidelidade usam prefixo de 7 digitos do CNPJ, vendedor e horario de cadastramento. O prefixo e mostrado apenas para revisao e nao e um identificador unico de empresa.
- A etapa de revisao e condicional; MRR e comissao de negociacao especial sao informados manualmente. Modulos permanecem auditaveis sem comissoes duplicadas.
- Competencias fechadas, reimportacoes e regras do catalogo financeiro devem ser respeitadas. **Nao estorne competencias em producao sem backup e conciliacao.**

## Documentacao complementar

- `docs/HOTFIX_R30_NEGOCIACOES_ESPECIAIS.md` e `docs/HOTFIX_R301_PREFIXO_CNPJ_VISIVEL.md` (quando presentes)
- `supabase/migrations/README.md` — referencia de migrations e regras antigas
- `docs/releases/README_HISTORICO_ATE_V2638.md` — historico anterior (conteudo do README antigo)
- `CHANGELOG.md` — historico geral; consulte `docs/` para detalhes por fase

> Esta revisao organiza apenas arquivos historicos da raiz: **nao move scripts, recursos CSS/JS, migrations existentes ou caminhos do GitHub Pages**.

## Ajuda integrada (R30.3)

O menu **Como usar** contem busca textual, atalhos e 24 procedimentos detalhados por area. O guia explica operacao mensal, comercial R30, bonificacao, estrategia, aparencia R30.2, comunicacao e acesso. Consulte tambem `docs/MANUAL_COMO_USAR_R303.md`.

## R30.4 — Status, qualidade individual e imagem de login

- **Visão do Squad → Ranking completo:** status oficial utiliza os critérios mensais da competência selecionada; o status de recorte aparece separado como simulação. A pontuação por período permanece indicativa.
- **Meu Desempenho → Minhas avaliações baixas:** exibe somente os totais do técnico selecionado de notas 1, 2 e 3 no período, mais consolidado mensal; detalhe diário aparece somente quando disponível. Não exibe atendimentos, clientes ou comentários identificáveis.
- **Aparência:** o fundo institucional comum tem sobreposição mais leve no login, sem utilizar imagens de Squads como substituição. Se a imagem não carregar, verificar a migration `MIGRACAO_V2.63.23_APARENCIA_INSTITUCIONAL_R302.sql` e o retorno da RPC `get_public_global_background`.
- O módulo **Como usar** inclui esses três procedimentos.
- **Sem migration nova** e sem alteração de cálculo financeiro, regras de bonificação, dados ou fechamento.
- Publicação: aplicar ZIP incremental sobre a R30.3; executar `npm run check`; publicar no GitHub; atualizar com Ctrl+Shift+R.


## Atualização R30.6 — Calendários e período responsivo

Os campos de datas/competências/horários usam seletor visual integrado; o botão **Aplicar análise** permanece visível com zoom e telas pequenas. Consulte `docs/MAPEAMENTO_CONTROLES_R306.md` para inventário, escopo e validação.
