# V2.63.3 — Catálogo comercial e regras de comissão

## Objetivo e limites

Esta etapa mantém os dois arquivos comerciais **CSV ou lançamento manual** como fontes de origem; não inclui APIs nem a importação financeira definitiva. A V2.63.3 pré-cadastra os produtos encontrados nos CSVs, permite editar a regra de comissão de cada produto e preserva o histórico de revisões no Supabase. **Nenhuma receita, comissão de pagamento, competência ou snapshot oficial é lançado/modificado por esta versão.**

## Instalação

1. Atualize o projeto a partir de **V2.63.2** utilizando o ZIP incremental (arquivos na raiz) ou aplique o patch à raiz.
2. Execute `supabase/migrations/MIGRACAO_V2.63.3.sql` no SQL Editor do Supabase depois das migrations V2.63.0, V2.63.1 e V2.63.2. Faça backup e homologue antes de produção.
3. Não há novas Edge Functions nesta versão. Publique o frontend e execute `npm run check`.
4. Abra **Gestão Estratégica > Automação**, selecione o tipo e carregue um CSV válido. Com as permissões adequadas, o pré-cadastro é tentado automaticamente; use **Reprocessar pré-cadastro do CSV** se necessário.
5. Selecione a origem no **Catálogo comercial e comissões por produto**; configure a regra, parâmetro quando exigido e clique em **Salvar regra**. Atualize a página e confira que as configurações persistem e o número de revisão se mantém.

## Modelo e identificação

- `strategy_commercial_products`: registro único por `(organization_id, source_key, normalized_name)`; nome original preservado e MRR definido pelo **tipo de origem**, nunca por um checkbox arbitrário do cliente.
- `strategy_commercial_commission_revisions`: revisões imutáveis da comissão com `changed_by`, `created_at` e número sequencial.
- `contracted_modules_csv`: Anotação de Venda / Produtos Contratados, com `generates_mrr = true`.
- `merchandise_sales_csv`: Venda de Mercadorias, com `generates_mrr = false`.
- O mesmo texto pode existir nas duas origens como **produtos comerciais distintos**. Dentro de uma mesma origem, acentos, pontuação, espaços e caixa são normalizados para evitar duplicidade.
- Somente produtos de **linhas com Squad A-E válido** são pré-cadastrados; não há deduplicação ou lançamento de vendas nesta etapa.
- O CSV permanece no navegador. Apenas nomes de produtos, origem e regras configuradas são persistidos no banco.
- A detecção automática depende de campos obrigatórios devidamente mapeados. O botão permite reprocessar depois de corrigir um mapeamento.

## Tipos de comissão

| Código | Regra | Configuração | Exemplo |
|---|---|---|---|
| `unconfigured` | Pendente | Sem parâmetro | Não calcular comissão |
| `full` | 100% da venda | Sem parâmetro | R$ 150 vendidos → R$ 150 |
| `percentage` | Percentual | Percentual de 0 a 100, 2 casas | R$ 200 × 20% → R$ 40 |
| `net_after_third_party` | Venda − terceiros | Custo padrão de terceiros, em R$ | R$ 200 − R$ 120 → R$ 80 |
| `fixed` | Valor fixo | Valor fixo por venda, em R$ | Venda R$ 350 → R$ 50 |

O custo de terceiros cadastrado é **valor de referência por produto**; custos específicos por venda serão contemplados na etapa de lançamentos. Se o custo superar uma venda, não gerar comissão negativa automática: a venda deverá ficar pendente de conferência. A modalidade fixa é por venda (linha), sem multiplicar automaticamente pela quantidade; eventuais regras por unidade serão tratadas explicitamente em versões posteriores.

## Segurança e persistência

- Leitura e RPCs limitadas à organização da conta autenticada e às permissões `people_costs` + `edit_costs`.
- Inserção em lote pela RPC `register_strategy_commercial_products_v2633` (até 200 nomes/lote), com `ON CONFLICT DO NOTHING` para não sobrescrever comissões existentes.
- Alteração de regra exclusivamente pela RPC `set_strategy_commercial_commission_v2633`, com bloqueio transacional (`FOR UPDATE`) e registro de revisão; regra idêntica não gera revisão adicional.
- O cliente autenticado recebe somente permissão `SELECT` nas duas tabelas, nunca `INSERT`, `UPDATE` ou `DELETE` direto.
- O mecanismo futuro de comissão deverá referenciar o ID de produto **e a revisão vigente na venda**, preservando o valor devido mesmo após alterações de regras.
- As receitas e comissões não integram o módulo de Bonificação até as fases V2.63.4-V2.63.6.

## Verificação real dos arquivos de referência

- Produtos Contratados: **15.566 registros**, **2.904** com grupo válido, **12.662** sem grupo, **42 produtos distintos elegíveis**.
- Venda de Mercadorias: **2.672 registros**, **0** sem grupo válido, **15 produtos distintos elegíveis**.
- Os números representam somente os arquivos fornecidos; os produtos efetivamente existentes no banco dependem da execução da migration e da importação na organização.

## Checklist de homologação

1. Enviar ambos os CSVs e confirmar 42/15 produtos elegíveis com os arquivos de referência.
2. Enviar o mesmo arquivo duas vezes: segunda leitura não cria produto duplicado nem altera regra configurada.
3. Configurar todos os tipos de comissão e recarregar a página; garantir valores e revisões corretos.
4. Alterar uma comissão já cadastrada e consultar histórico na tabela `strategy_commercial_commission_revisions`.
5. Confirmar que vendedor de Squad C não exige vínculo operacional e que nenhum registro sem grupo é pré-cadastrado.
6. Validar acesso negado para conta sem permissão e para usuário de outra organização, incluindo RPCs.
7. Verificar que nenhuma tabela de bonificação, receita, competência fechada ou snapshots foi alterada.
8. Executar `npm run check` e conferir o GitHub Actions sem divergência de cache-buster (`2.63.3-r1`).

## Próxima versão

**V2.63.4 — Importação da Receita Recorrente:** consumir as identidades já conciliadas e os produtos pré-cadastrados para reconhecer cada linha única da Anotação de Venda como contratação de novo MRR, respeitando competência e idempotência. Não gerar pagamento de comissão até V2.63.6.
