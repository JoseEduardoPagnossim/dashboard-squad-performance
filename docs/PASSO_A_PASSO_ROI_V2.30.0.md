# Passo a passo — implantação do ROI do Suporte V2.30.0

## 1. Banco de dados

No Supabase, abra **SQL Editor** e execute todo o conteúdo de:

`supabase/migrations/MIGRACAO_V2.30.0.sql`

O esperado é `Success. No rows returned` ou equivalente.

A migration:

- não apaga dados;
- não recria as tabelas existentes;
- amplia `support_monthly_costs` com campos do ROI;
- cria `support_roi_opportunities`;
- habilita RLS e `GRANT` explícito para `authenticated` na nova tabela.

## 2. Publicação do frontend

Depois da migration, publique o conteúdo completo desta versão no repositório GitHub Pages.

Se estiver usando Git local:

```bash
git status
git add .
git commit -m "Adiciona ROI do Suporte V2.30.0"
git push origin main
```

## 3. Conferir GitHub Actions

Abra **Actions > Quality Gate** e confirme que `validate` e `test` ficaram verdes.

## 4. Primeiro acesso

Entre como **Admin Geral** e abra **ROI do Suporte**.

O painel já reaproveita automaticamente:

- atendimentos;
- técnicos;
- Squads;
- competências;
- custos legados, quando existirem;
- clientes ativos/ticket do Impacto financeiro, quando existirem.

## 5. Informações que normalmente ainda precisam ser preenchidas

- composição detalhada de custos;
- churn de referência;
- churn atual;
- metodologia e quantidade de clientes, quando não houver fallback adequado;
- ticket médio, quando não houver fallback;
- oportunidades de receita adicional.

Essas informações podem ser preenchidas manualmente ou importadas por CSV.

## 6. Teste mínimo recomendado

1. selecione uma competência;
2. preencha custos, ticket, churn e clientes;
3. salve;
4. cadastre uma oportunidade como `Convertida`;
5. confira o card Receita adicional;
6. clique em **Como este valor foi calculado?** nos cards;
7. confira o histórico;
8. altere valores no simulador e confirme que eles não mudam os cards realizados;
9. importe uma cópia dos modelos CSV e valide a prévia.

## 7. Modelos CSV

- `models/roi_configuracoes_mensais.csv`
- `models/roi_oportunidades.csv`

A estrutura e cada coluna estão documentadas em `docs/ROI_SUPORTE.md`.
