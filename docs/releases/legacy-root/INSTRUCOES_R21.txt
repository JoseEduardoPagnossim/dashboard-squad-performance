HOTFIX R21 - GESTAO FINANCEIRA CENTRALIZADA DOS LIDERES
Base: R20 (com migrations anteriores aplicadas)
1. Faça backup do Supabase.
2. Execute supabase/migrations/MIGRACAO_V2.63.16_GESTAO_LIDERES_R21.sql.
3. Copie os arquivos do ZIP sobre o projeto R20, preservando caminhos.
4. Publique frontend e atualize sem cache.
5. Em Administracao > Bonificacao > Minha comissao do mes, use a secao Squads financeiros dos administradores.
6. Selecione competencia, Squad e salve cada vinculo. Nao muda os valores de comissoes nem indicadores operacionais.
7. Reabra conciliacao e confirme aliases dos vendedores antes da importacao.
Teste local: npm run check - 1127 aprovados / zero falhas. SQL nao executado no Supabase de producao.
Commit: feat: permite vincular squads financeiros dos lideres pela bonificacao
