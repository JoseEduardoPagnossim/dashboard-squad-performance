# V2.56.1 — Filtro de Squad consistente em Indicadores

## Problema corrigido

Na aba **Indicadores · Qualidade**, a troca do filtro de Squad podia renderizar o novo escopo antes de as competências completas desse Squad estarem carregadas. Na prática, o usuário podia precisar passar primeiro por **Indicadores gerais / Desempenho** para que a Qualidade refletisse corretamente o mesmo filtro.

## Ajuste

A troca de Squad dentro de Indicadores agora aguarda o carregamento dos dados completos das competências que participam do período ativo antes da renderização final da tela.

Isso vale para:

- um Squad específico;
- **Todos os Squads**;
- Qualidade;
- Dias úteis;
- Detalhamento.

**Indicadores gerais / Desempenho** mantém o fluxo assíncrono já existente, que já respondia corretamente ao filtro, evitando ampliar o tempo de espera nessa tela.

A aba **Impacto financeiro** continua fora desse fluxo porque possui escopo corporativo próprio e não usa o filtro de Squad.

Ao trocar a subaba de Indicadores, o sistema também revalida os dados necessários em segundo plano. Isso evita que uma subaba dependa de outra ter sido aberta previamente.

## Preservação

O hotfix não altera fórmulas, metas, regras de Qualidade, Gestão Preditiva, bonificação, importações ou persistência. Não existe migration para esta versão.
