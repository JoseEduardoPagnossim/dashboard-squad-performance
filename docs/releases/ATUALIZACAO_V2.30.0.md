# Atualização V2.30.0 — ROI do Suporte Técnico

## Objetivo

Adicionar uma primeira versão funcional, auditável e transparente do ROI do Suporte, sem substituir as fontes atuais nem criar API nova.

## Alterações principais

- nova área **ROI do Suporte** para Admin Geral;
- cards de custo, atendimentos, clientes, custo por atendimento/cliente, churn, receita protegida estimada, receita adicional realizada, benefício econômico e ROI;
- detalhamento financeiro mensal no registro já existente de `support_monthly_costs`;
- nova tabela `support_roi_opportunities`;
- cadastro manual de oportunidades e importação em lote;
- dois modelos CSV para download;
- prévia e validação antes da confirmação da importação, com arquivo e data/hora registrados;
- histórico mensal, trimestral e anual;
- cinco visões gráficas;
- simulador de impacto sem persistência e identificado como projeção;
- modal de metodologia/origem para cada indicador financeiro;
- auditoria das configurações e oportunidades do ROI;
- regras puras de ROI em `js/roi-rules.js` e testes automatizados.

## Banco

Para base existente na V2.29.9, execute apenas:

```text
supabase/migrations/MIGRACAO_V2.30.0.sql
```

Não execute `schema.sql` em uma base existente.

## Ordem de publicação

1. aplicar `MIGRACAO_V2.30.0.sql` no Supabase;
2. validar o retorno `Success`;
3. publicar os arquivos da V2.30.0 no GitHub;
4. aguardar o Quality Gate;
5. abrir **ROI do Suporte** com Admin Geral;
6. preencher uma competência controlada e validar os cálculos;
7. testar importação com os modelos incluídos.

Nenhuma Edge Function precisa ser republicada por esta versão.
