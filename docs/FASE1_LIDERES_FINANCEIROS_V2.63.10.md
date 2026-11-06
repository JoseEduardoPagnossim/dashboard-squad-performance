# Fase 1 — Líderes financeiros por Squad (incremental sobre V2.63.9 R5)

## O que mudou
- Quatro líderes com acesso administrativo podem escolher **Squad financeiro A, B, D ou E** para uma competência, sem receber produção técnica fictícia.
- Formulário do administrador: comissão-base, vendas, bônus manual, desconto, redistribuição, férias e observação.
- Fórmula do valor do líder: `comissão-base + comissão-vendas + bônus-manual - desconto + redistribuição`.
- Excel **Tecnicos** e PDF da bonificação apresentam líder do Squad na mesma tabela financeira (status `LÍDER • SEM PRODUÇÃO`). Colunas de atendimento, médias, avaliações e demais métricas operacionais ficam vazias para o líder; não há inclusão em `m.technicians`, FCR, rankings ou denominadores.
- Competências já existentes sem Squad financeiro **não recebem grupo presumido**; precisam ser conciliadas pelo próprio usuário antes de aparecer em relatórios por Squad.
- Os registros antigos preservam `amount` como comissão-base, mantendo o total anterior quando não existirem ajustes complementares.

## Como aplicar
1. **Faça backup** do projeto e do banco. Publique em ambiente de homologação.
2. Aplique `supabase/migrations/MIGRACAO_V2.63.10_FASE1_LIDERES.sql` no SQL Editor do Supabase.
3. Copie os arquivos modificados do ZIP incremental sobre sua versão **V2.63.9 R5**. A versão técnica base foi preservada porque vários testes de regressão validam especificamente seus identificadores; após publicar, faça atualização forçada do navegador (`Ctrl+F5`) para substituir o cache de `app.js` e `index.html`.
4. Para cada um dos quatro líderes, acesse o módulo Administração > Financeiro, escolha o Squad correto na seleção geral e no campo Squad financeiro, informe valores e salve. Repita se necessário para outras competências.
5. Gere Excel e PDF em cada Squad e confira **uma única linha** do líder e ausência de impacto nos indicadores operacionais.
6. Rode `npm run check`; homologue RLS, pessoas, competências e arquivos exportados com dados reais antes da produção.

## Limitações e próximos passos
- Não foi implementada a nova experiência de importação CSV nesta fase.
- Comissões comerciais de líderes não são sincronizadas automaticamente do motor de vendas: o campo de venda é **manual** nesta fase, para evitar duplicidade sem integração auditada.
- Campos diretamente operacionais (prêmio por atendimento, notas, descontos automáticos ligados à produção e teto técnico) não se aplicam aos líderes. Não são calculados artificialmente.
- A inclusão financeira do líder no Excel/PDF não altera os totais já congelados nos snapshots de bonificação técnica; valores de liderança são exibidos como linhas financeiras separadas, sem modificar a folha técnica consolidada.
- A migration não reatribui historicamente líderes sem vínculo. Registros de competências fechadas devem ser regularizados mediante processo auditado, não por edição livre.
- O projeto não foi publicado automaticamente no GitHub nem a migration executada no Supabase.
