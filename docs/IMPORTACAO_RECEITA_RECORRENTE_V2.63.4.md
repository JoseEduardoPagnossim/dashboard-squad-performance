# V2.63.4 — Importação de Receita Recorrente (Novo MRR)

## Escopo e regra de negócio

Esta versão transforma as contratações do CSV de **Anotação de Venda / Últimos Produtos Contratados** em eventos confirmados de Receita Direta, com atribuição individual por usuário vinculado à pessoa estratégica e por Squad. Os registros devem possuir **grupo A–E**, vendedor conciliado e com conta ativa, produto pré-cadastrado na origem MRR, data civil válida e `Vl Atual Ativo` estritamente positivo.

- **`Vl Anterior` não é usado.** `Vl Atual Ativo` = mensalidade adicionada ao plano; grava como `gross_amount` (valor da contratação), `monthly_recurring_amount` (Novo MRR) e `annual_recurring_amount = 12 × MRR` (ARR contratual, indicador paralelo). **Não equivale a valor recebido**, nem representa recebimentos futuros acumulados.
- A competência vem exclusivamente da **data da venda**, ignorando a hora. Lançamento em 28/10/2026 fica em outubro/2026. Data inválida não é corrigida automaticamente por timezone.
- **Receita Direta e MRR não devem ser somados duas vezes.** O lançamento econômico ocorre uma única vez, no mês da contratação. **Nenhuma comissão é gerada nesta versão** (motor V2.63.6).
- O sistema **não** modifica registros de competências fechadas, nem seus snapshots. Competências inexistentes são abertas como rascunho somente quando existe venda elegível a registrar.
- Itens sem grupo válido são ignorados. Vendedor, produto ou valor inválidos ficam na prévia de pendências. **Nenhum valor é atribuído a um vendedor por aproximação incerta**.

## Idempotência, ocorrências idênticas e limites

O CSV não possui um ID permanente de item contratual. Por isso, a identidade provisória é um MD5 determinístico dos atributos da venda (dia, nome normalizado do vendedor, Squad, produto normalizado, valor em centavos, CNPJ, cliente e data do item contratual) **mais o ordinal da ocorrência idêntica no arquivo** (1ª, 2ª, 3ª...). A identidade é calculada novamente e protegida no **Supabase**, com uma chave única por organização e fonte comercial; a operação utiliza bloqueio transacional e verificação de existência. **Reimportar o mesmo registro não cria outra receita ou comissão.** Nenhuma coluna de valores anteriores participa da chave.

A identificação provisória tem uma limitação: dois negócios legítimos com os mesmos campos podem parecer iguais, especialmente sem CNPJ ou identificador do item. Como você definiu que **cada linha é uma venda**, linhas inteiramente idênticas no mesmo arquivo **são todas reconhecidas**, usando ordinais por ocorrência para não descartá-las. Uma nova extração completa repetida terá os mesmos ordinais. **Limitação:** se o usuário importar apenas uma seleção parcial de vendas indistinguíveis, o ordinal pode corresponder a uma ocorrência antiga; neste caso, não é possível garantir a inclusão de uma nova venda sem um ID permanente. A importação integral é o caminho recomendado até existir um identificador próprio do item. Evite alterar seleção de identificadores (Cliente, ClienteCNPJ, DataCadItemContrato) entre reimportações do mesmo arquivo; alterações podem mudar a chave. Reconciliação futura com IDs permanentes permanece necessária.

Cada lote registra origem, arquivo, mapeamento, usuário, total de linhas aptas, quantidade de receitas criadas e de duplicatas ou competências fechadas. As tentativas são auditadas e identificadas por lote. O upload é limitado a 10 MB, com até 50.000 linhas analisadas. Envio em blocos de até 100 vendas. Se uma conexão cair após processamento parcial, o banco preserva os registros anteriores; **a reimportação integral não duplica vendas já aceitas**, e o lote anterior poderá permanecer em rascunho para auditoria.

## Banco e controles de acesso

Migration `supabase/migrations/MIGRACAO_V2.63.4.sql` (depende de V2.63.0 a V2.63.3 e Fase 5):

- `strategy_recurring_sales`: ledger imutável com a referência ao evento confirmado em `strategy_result_events` e à pessoa, produto, competência, lote e data civil. Salva também a revisão e os parâmetros da comissão configurada **no momento da importação**, mas **não calcula nem paga** a comissão. Produtos sem regra permanecem com status `unconfigured` registrado para conciliação posterior.
- `strategy_recurring_import_attempts`: histórico de tentativa por venda e lote (`imported`, `duplicate`, `closed`).
- RPCs de escrita autenticadas `start_strategy_recurring_batch_v2634`, `import_strategy_recurring_sales_v2634` e `finish_strategy_recurring_batch_v2634`. Todas obtêm organização pelo perfil autenticado e exigem `people_costs` e `edit_costs`. **O cliente não pode gravar diretamente no ledger**; consultas submetem-se a RLS.
- Verificação server-side do vendedor via nome exato ou alias aprovado, role `pre_attendance` para C e `technician` para os demais; confere pessoa, produto, organização e origem. Impede confirmar vendas em competências fechadas e alterações diretas a eventos/atribuições importados.
- Não faz operações no módulo de Bonificação, folha, importação de mercadorias, receita influenciada/protegida ou snapshots oficiais.

## Instruções

1. Fazer backup, aplicar a migration **depois** da V2.63.3 e publicar arquivos da V2.63.4. Não há Edge Functions novas.
2. Em **Gestão Estratégica → Automação**, abrir a origem **Anotação de Venda · Gera MRR**, selecionar o CSV e conferir mapeamento, vendedores e catálogo.
3. Na seção **Receita recorrente · Novo MRR**, conferir quantidade apta, pendências e MRR elegível. Somente **Confirmar importação** grava; confirme a caixa de diálogo explicitamente.
4. Verificar o resumo com novas, duplicadas e fechadas; consultar Receita Direta e Novo MRR da competência na Gestão Estratégica. Carregar o mesmo CSV novamente para verificar que todas as vendas já importadas aparecem como duplicadas.
5. Conferir no Supabase que nenhuma comissão foi criada e nenhuma competência fechada foi alterada. Testar com usuários de outra organização e com permissões restritas.
6. Executar `npm run check` e verificar `npm run validate`, versões `2.63.4-r1` e tests.

## Limites da homologação local

Os testes automatizados verificam regras de preparação, integridade e contratos SQL. Sem acesso ao ambiente real do Supabase, execução SQL, RLS com contas reais, valores efetivamente faturados e percurso visual no navegador **não ficam homologados**. Não lançar dados reais antes de executar esse checklist em homologação.
