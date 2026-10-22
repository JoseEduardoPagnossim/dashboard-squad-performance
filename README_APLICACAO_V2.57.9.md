# Aplicação da V2.57.9 — Hardening, segurança e regressões

Este pacote foi preparado sobre o estado público do `main` revisado em 22/10/2026.

## Por que V2.57.9?

O roadmap previa o hardening como V2.57.7, porém o repositório já utiliza:

- V2.57.7 para saneamento de técnicos excluídos na reimportação;
- V2.57.8 para reimportação operacional substitutiva.

Por isso o fechamento da Fase 2 passa para V2.57.9, sem sobrescrever histórico.

## O que o aplicador altera

- `package.json`
- `package-lock.json`
- `index.html`
- `js/app.js`
- `js/strategy-access.js`
- `js/strategy-data.js`
- `js/strategy-cost-engine.js`
- `js/strategy.js`
- `scripts/validate-project.mjs`
- `tests/strategy-hardening-v2579.test.js`
- `docs/HARDENING_ESTRATEGIA_V2.57.9.md`
- `CHANGELOG.md`
- `README.md`

## Aplicação

Na raiz do repositório, em uma branch de trabalho:

```bash
git checkout -b feat/v2.57.9-hardening
node apply-v2579.mjs
npm run check
git diff --check
git status --short
```

O aplicador é defensivo: se um trecho crítico do `main` não corresponder ao código revisado, ele interrompe em vez de substituir conteúdo desconhecido silenciosamente.

## Testes adicionados

A suíte V2.57.9 cobre:

1. campo oficial do banco com `false` prevalecendo sobre estado camelCase antigo com `true`;
2. limpeza imediata dos dados financeiros em memória quando o acesso muda/revoga;
3. bloqueio de `total_cost` negativo;
4. percentual de rateio limitado a `0..1`;
5. consolidação de aliases de Squad (`a` + `A`) antes do rateio;
6. preservação exata do total distribuído em centavos;
7. atualização da regra do motor para `SC-0.6.1`;
8. guarda de permissão agregada antes da análise/renderização executiva.

## Banco

Não há migration nova na V2.57.9. Esta versão endurece cliente, normalização, renderização, cálculo e regressões. As regras de RLS/RPC existentes continuam sendo a proteção autoritativa do servidor.

## Critério para avançar à Fase 3

Só considerar a Fase 2 encerrada depois de:

- `npm run check` verde no repositório completo;
- teste manual de um usuário com agregados liberados;
- teste manual de um usuário com Gestão Estratégica liberada e agregados negados;
- revogação do próprio acesso confirmando que valores anteriores somem sem refresh;
- fechamento/reabertura de uma competência validando que snapshots anteriores continuam íntegros.
