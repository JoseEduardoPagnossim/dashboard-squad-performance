# V2.63.5 — Importação de Vendas Avulsas (CSV Venda de Mercadorias)

## Escopo

Importa vendas **avulsas** pelo CSV de Venda de Mercadorias com os campos `id`, `Data`, `Vendedor`, `grupo`, `Produto`, `quantidade` e `vlTotalItem`. Cada linha é um item vendido, podendo haver mais de um item para o mesmo `id`. **Não gera MRR nem ARR**, não calcula comissão e não modifica o módulo de Bonificação nesta versão. A V2.63.6 usará o registro comercial e a revisão de regra de comissão preservados por venda.

- `vlTotalItem` **já é o total vendido daquele item**. Nunca multiplicar pela coluna `quantidade`. Quantidade serve para contexto da venda e histórico de regras comerciais futuras.
- `Data` pode conter hora; usar apenas a **data civil** informada, sem deslocamento por timezone. Competência = primeiro dia do mês da venda.
- `Vendedor` precisa estar conciliado à conta ativa + pessoa estratégica na mesma organização e no mesmo grupo. Grupo C exige perfil `pre_attendance` e pessoa funcional de Pré-atendimento; A, B, D e E exigem perfil Técnico. Nomes divergentes só são aceitos com alias aprovado por origem e grupo.
- Produto deve existir no catálogo `merchandise_sales_csv` com `generates_mrr=false`. Não misturar com produtos de mesmo nome da origem recorrente.
- Grupo vazio/inválido é ignorado. Produto, vendedor, data, ID, quantidade ou valor inválidos ficam pendentes e não são lançados. Somente linhas aptas integram a gravação por lote.
- Cada venda aprovada gera um `strategy_result_events` de tipo `direct`, `status=confirmed`, `direct_revenue_category='direct_sale'`, `gross_amount=vlTotalItem`, **`monthly_recurring_amount=0` e `annual_recurring_amount=0`**; uma atribuição aponta para a pessoa estratégica e o Squad. Não reconhecer caixa/recebimento bancário.

## Idempotência e linhas idênticas

A coluna `id` é identificador da venda e pode aparecer em vários produtos. Portanto a chave **não** é somente o ID: o banco recalcula o MD5 determinístico de identificador de venda normalizado + data civil + vendedor normalizado + Squad + produto normalizado + valor total em centavos + quantidade + ordinal da ocorrência idêntica. A unicidade é `organization_id + source_key + sale_identity`, protegida por verificação, bloqueio transacional e constraint única. O mesmo CSV completo pode ser importado novamente sem duplicar receitas.

Linhas com todos os campos iguais **dentro do arquivo** são preservadas como vendas distintas pelo ordinal 1, 2, 3... Assim, duas vendas idênticas presentes no mesmo arquivo são lançadas individualmente. **Limitação sem ID de item estável:** se você importar um arquivo *parcial* e houver vendas comercialmente indistinguíveis, os ordinais podem não representar a mesma ocorrência da extração original. Prefira reimportações integrais até o CSV oferecer um identificador permanente de item.

## Segurança e dados

Migration `supabase/migrations/MIGRACAO_V2.63.5.sql`, depois das V2.63.0–V2.63.4:

- `strategy_merchandise_sales`: ledger com organização, origem, ID de venda, quantidade, valor, produto, pessoa, Squad, lote, competência, evento de Receita Direta e **snapshot da revisão/regra de comissão** (sem apuração nesta versão).
- `strategy_merchandise_import_attempts`: auditoria de tentativas por lote (`imported`, `duplicate`, `closed`).
- RPCs `start_strategy_merchandise_batch_v2635`, `import_strategy_merchandise_sales_v2635`, `finish_strategy_merchandise_batch_v2635` usando `auth.uid()`, `current_profile()`, `people_costs` e `edit_costs`. Validam tudo novamente no servidor, sem confiar na prévia do navegador.
- RLS por organização, sem permissão de escrita direta ao ledger. Triggers de proteção contra edição ou exclusão dos eventos e atribuições comerciais importados, separados dos triggers da V2.63.4.
- Competências fechadas não aceitam novas vendas. Não altera snapshots, bonificações, receitas de outras origens ou eventos de MRR.

O front-end processa até 50.000 linhas, arquivos de até 10 MB (limites do importador existente). O servidor recebe lotes de até 100 vendas aptas. Interrupções podem deixar um lote em rascunho; reimportar **o mesmo CSV** não duplica as receitas aceitas, e tentativas são preservadas para auditoria.

## Aplicação e conferência

1. Faça backup do banco e da V2.63.4. Execute a migration V2.63.5 no SQL Editor do Supabase (homologação antes de produção).
2. Extraia o ZIP incremental sobre a V2.63.4, substitua os arquivos e publique. Não há Edge Functions novas.
3. `npm run check` precisa passar com cache-busters `2.63.5-r1` uniformes.
4. Em **Gestão Estratégica → Automação**, selecione **Venda de Mercadorias — Não gera MRR**, escolha o CSV, confira mapeamento, vendedores, produtos e a seção **Receita avulsa**.
5. Clique em **Confirmar importação avulsa**, aceite o diálogo e confira novas/duplicadas/fechadas. Repita a importação integral para conferir a idempotência e cheque a Receita Direta da competência.
6. Homologue conta do Squad C, conta do Suporte, permissões restritas, usuário de outra organização, competência fechada, IDs repetidos com itens diferentes e tentativas de alterar evento importado diretamente.

## Conferência com o CSV recebido

Leitura local do arquivo de referência de 28/10/2026: **2.672 linhas**, **15 produtos normalizados**, **nenhuma linha sem Squad válido**, **13 linhas pertencentes a grupos de conteúdo comercial idêntico**. Com vendedores e produtos ficticiamente conciliados **apenas para testar o parser**, 2.672 linhas ficaram aptas, com valor bruto total de **R$ 414.930,76**. Esses dados são uma simulação: **nenhuma gravação foi efetuada no Supabase da empresa**. O total real dependerá da conciliação, das duplicatas previamente registradas e de competências fechadas.

## Fora do escopo

- Cálculo/apuração/pagamento de comissão e vinculação ao módulo de Bonificação (V2.63.6).
- Lançamento manual e ajustes retroativos (V2.63.7).
- Conciliação financeira e fechamento mensal consolidado (V2.63.8).
- Integração via API ou importação de pagamentos bancários.

## Limites de homologação

Os testes locais validam parser, mapeamento, contratos SQL, código e versão do projeto. A execução real da migration, políticas RLS, rotas do navegador e resultado financeiro no Supabase **dependem de homologação no ambiente conectado**. Não tratar os resultados da simulação como receita contabilizada.
