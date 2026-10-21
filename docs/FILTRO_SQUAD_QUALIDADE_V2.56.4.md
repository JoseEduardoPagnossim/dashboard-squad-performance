# V2.56.4 — Filtro de Squad sincronizado nos Indicadores

## Problema observado

Ao alterar o Squad diretamente na subaba **Qualidade**, os dados podiam permanecer no escopo anterior. Ao passar antes por **Desempenho** e retornar à Qualidade, o filtro passava a funcionar.

## Causa tratada

A troca de Squad disparava a atualização visual e iniciava o carregamento detalhado de forma assíncrona, sem aguardar sua conclusão. Além disso, as versões 2.56.1/2.56.2 mantinham um controlador de hidratação específico para Qualidade, diferente do ciclo normal da tela de Indicadores.

## Correção

- `selectSquad` agora aguarda `ensureViewData` antes da renderização final.
- O carregamento mensal possui modo `strict` para que falhas não sejam ocultadas na troca explícita de Squad.
- Respostas antigas são descartadas por sequência de seleção.
- Qualidade usa somente o estado global do Squad e a disponibilidade dos dados completos; não possui mais controlador próprio de hidratação.
- A troca de subaba usa `hydrateCurrentViewAsync`, o mesmo ciclo comum dos Indicadores.

## Compatibilidade

A alteração é frontend-only, não modifica fórmulas, schema, migrations, importações ou regras de bonificação.
