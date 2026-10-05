# V2.43.0 — Performance e carregamento progressivo

A V2.43.0 reduz o caminho crítico entre autenticação e interface utilizável. A mudança é estrutural: a Home deixa de esperar todo o histórico, todos os detalhes diários e todos os módulos financeiros antes de aparecer.

## Fluxo anterior

O login autenticava, buscava o perfil e então carregava sequencialmente os Squads. Para cada Squad, o frontend trazia tema, todas as competências, técnicos, métricas diárias, qualidade e financeiro. Depois ainda executava consolidados organizacionais. A interface só era liberada ao final desse processo.

## Fluxo V2.43

1. autentica a sessão;
2. chama `get_initial_dashboard_context()`;
3. recebe perfil/permissões, Squads acessíveis, índice leve de competências e resumo da competência mais recente;
4. monta a Home e libera a interface;
5. detalhes da competência, tema, históricos e consolidados entram sob demanda ou em segundo plano.

A RPC inicial evita transportar métricas diárias e regras financeiras no índice de competências. Para Técnicos, o resumo de pessoas também é limitado ao próprio vínculo.

## Lazy loading

`ensureMonthLoaded()` carrega a competência completa somente quando uma tela precisa de detalhe. O carregamento é deduplicado: se duas partes pedirem a mesma competência enquanto a consulta ainda está em andamento, ambas aguardam a mesma Promise.

`ensureViewData()` decide os dados necessários conforme a rota. Home é leve; Meu desempenho, Visão do Squad, Indicadores e áreas operacionais solicitam detalhe apenas quando abertas. Consolidados organizacionais e comissões do Admin Geral também são carregados sob demanda.

## Paralelismo

Consultas independentes usam `Promise.all`, incluindo consolidados organizacionais, comissões e carregamento de várias competências/Squads. Isso elimina esperas sequenciais desnecessárias.

## Cache de sessão

`js/performance-engine.js` mantém cache em memória e `sessionStorage`:

- contexto inicial: 2 minutos;
- competência completa: 5 minutos;
- tema por Squad: 10 minutos.

O cache é invalidado após alterações relevantes, como importação, fechamento/reabertura e gravação de tema. O contexto inicial pode ser mostrado imediatamente e revalidado em segundo plano.

## Diagnóstico

Após o login, o frontend publica:

```js
window.SoftenPerformanceDiagnostics.latest
window.SoftenPerformanceDiagnostics.get()
```

O snapshot informa o tempo total até a interface utilizável e as etapas medidas. Isso permite comparar a performance real por navegador/rede sem depender apenas de percepção.

## Supabase e migration

Execute `supabase/migrations/MIGRACAO_V2.43.0.sql` antes de publicar o frontend. Ela cria a RPC `get_initial_dashboard_context()` e índices para competência e detalhes diários.

Se a RPC ainda não existir, o frontend possui fallback otimizado com consultas paralelas. O ganho máximo, porém, depende da migration.

## Assets

A biblioteca Supabase recebe `preconnect`/`preload`, o script dinâmico é assíncrono e a trilha sonora deixa de fazer preload no boot. Assets históricos sem referência em runtime foram retirados do pacote da V2.43.

## Compatibilidade

Não foram alteradas fórmulas de bonificação, férias, metas, importação, permissões, TV, avatar ou fechamento. A V2.43 muda quando os dados são carregados, não como os dados oficiais são calculados.

## Meta operacional

A arquitetura foi preparada para reduzir significativamente o tempo até a Home utilizável. O tempo real depende da rede, região do Supabase e volume de dados e deve ser conferido pelo diagnóstico de performance após o deploy.
