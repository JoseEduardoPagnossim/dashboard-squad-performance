# Hotfix R26 — Comparativo consolidado dos Squads para tecnicos

## Objetivo
Exibir os Squads A, B, D e E nos graficos **Quantidade de atendimentos por Squad** e **Taxa media de avaliacao mensal por Squad** em **Visao do Squad**, inclusive para perfis tecnicos, mantendo o detalhamento individual limitado ao proprio Squad.

## Diagnostico
`ensureViewData()` carregava o RPC `get_org_squad_monthly_overview` apenas quando `isSuperAdmin()`. Sem esse consolidado, `orgOverviewRows()` recorria a `state.squads`, que em perfil tecnico normalmente contem apenas o Squad do usuario.

## Mudancas
- Em `Visao do Squad`, todos os perfis autenticados passam a solicitar SOMENTE `get_org_squad_monthly_overview`, que agrega dados por Squad, ano e mes, com filtro `organization_id` associado a `auth.uid()`.
- RPCs de tecnico e diarios (dados mais detalhados) continuam reservados ao fluxo privilegiado preexistente.
- Os dois graficos de `Visao do Squad` usam exclusivamente o consolidado retornado para o periodo, mesmo se vazio; nao fazem fallback silencioso ao proprio Squad.
- Enquanto o consolidado nao estiver carregado, a tela informa carregamento, em vez de exibir apenas o Squad como se fosse o universo completo.
- Cache bust `2.63.9-r26` aplicado de maneira uniforme.

## Banco e seguranca
**Nao exige migration** se o Supabase ja tem a funcao `public.get_org_squad_monthly_overview()` da migration V2.29.5 (ou equivalente). A funcao e `SECURITY DEFINER`, valida perfil ativo e limita os resultados a organizacao do usuario autenticado. Nao expoe nomes, metricas individuais nem financeiras dos demais times.

## Instalacao
1. Manter a R25 e a R23 com suas migrations aplicadas. Nao aplicar a R24 de bonificacao, que foi desconsiderada.
2. Copiar os arquivos deste ZIP para as pastas correspondentes, substituindo as versoes existentes.
3. Atualizar a pagina uma vez com Ctrl+Shift+R.
4. Validar usando conta de tecnico do Squad D e Outubro/2026: devem aparecer quatro legendas (A, B, D, E) nos dois graficos. Testar tambem conta administrativa.
5. Se nao aparecerem, conferir o Console e os logs de Auth/RPC. Conferir se o banco possui `get_org_squad_monthly_overview` e retorna quatro Squads ativos da organizacao; sem RPC, nenhum frontend pode inventar dados.

## Testes
`npm run check`: 1.143 testes aprovados, 0 falhas (validacao local). Verificacao visual e autorizacao no banco real pendentes de homologacao.

## Commit
`fix: libera comparativo agregado dos squads para tecnicos (R26)`
