# V2.63.1 — Importador CSV configurável (Fase 8)

## Escopo entregue

- Gestão Estratégica → Automação → Importador CSV configurável.
- Escolha entre **Anotação de Venda / Produtos Contratados** (gera MRR) e **Venda de Mercadorias** (não gera MRR).
- Leitura no próprio navegador, com limite de 10 MB e 50.000 linhas, detectando delimitador vírgula, ponto e vírgula, TAB ou `|` e CSVs com aspas, aspas duplas escapadas, quebra de linha e BOM UTF-8. Arquivos UTF-8 são preferenciais; Windows-1252 é contingência.
- Sugestões de mapeamento por origem, seleção das colunas com campos obrigatórios/ opcionais, validação antes de mostrar prévia, 12 linhas na prévia e exibição da data civil sem converter fusos.
- `Vl Atual Ativo` é o único valor mensal de novos contratos mapeado como MRR. `Vl Anterior` **não entra no mapeamento**. Na venda avulsa, `vlTotalItem` já representa o total da linha, sem nova multiplicação pela quantidade.
- Identificação local de nomes de produtos distintos por origem e frequência; ignoram-se registros com grupo vazio/inválido. Grupo C continua válido para o Pré-atendimento. Nomes equivalentes (acentos, espaços, caixa) são agrupados para fins de lista, sem assumir que modalidades comerciais diferentes são iguais.
- Modelos de mapeamento salvos em `strategy_import_mappings` por organização e origem, com nome e associação campo→coluna; reutilização condicionada a conferir se o arquivo atual tem todas as colunas esperadas. Os dados de clientes e vendas **não são enviados** na gravação de modelos.
- RLS restrita a organização, permissão `people_costs` e `edit_costs`; modificações de modelo restritas ao seu autor. Sem gravação financeira ou de lotes nesta versão.

## Passos de instalação

1. Ter instalado V2.63.0 R3, incluindo SQL e Edge Functions da V2.63.0.
2. Fazer backup e aplicar `supabase/migrations/MIGRACAO_V2.63.1.sql` no SQL Editor do Supabase.
3. Publicar os arquivos modificados no repositório e executar `npm run check`.
4. Abrir Gestão Estratégica → Automação como gestor habilitado; escolher o tipo de CSV e o arquivo.
5. Conferir colunas detectadas e obrigatórias, ver a prévia e a lista de produtos.
6. Digitar nome e clicar **Salvar mapeamento**; selecionar o modelo e clicar **Aplicar modelo** com arquivo compatível.

## Formatos dos arquivos de referência verificados

- Anotação de venda: 15.566 linhas e 14 colunas no CSV de 28/10/2026; campos obrigatórios `Data Lançam.`, `UsuarioVenda`, `grupoAtendimento`, `Produto` e `Vl Atual Ativo`; a identificação local reconheceu 42 descrições distintas nas linhas com Squad válido e 12.662 linhas com grupo vazio/inválido foram excluídas dessa listagem.
- Venda de mercadorias: 2.672 linhas e 7 colunas; campos obrigatórios `id`, `Data`, `Vendedor`, `grupo`, `Produto`, `vlTotalItem`, e `quantidade` opcional; 15 produtos distintos identificados nas linhas com Squad válido.

> Estes números foram obtidos **sobre os dois CSVs recebidos como referência**, não são receitas importadas ou cadastradas no Supabase.

## Limites e próximas versões

- A V2.63.1 **não cria eventos de receita, MRR oficial, comissões, produtos definitivos nem importações financeiras**. Esses passos serão liberados após conciliação de pessoas, catálogo e regras comerciais nas V2.63.2–V2.63.6.
- Não há upload dos dados do CSV ao servidor nesta versão; somente o modelo de colunas (nomes e seleção) é persistido.
- Produtos que aparecem em fontes diferentes não devem ser fundidos automaticamente. O pré-cadastro real de produtos e as quatro modalidades de comissão são parte da V2.63.3.
- Reimportação idempotente e deduplicação de vendas pertencem às V2.63.4–V2.63.6; a prévia preserva registros repetidos intencionalmente e não os contabiliza.
- Não lançar receita em competências fechadas e não modificar snapshots. APIs permanecem fora do escopo da Fase 8.

## Homologação pendente no ambiente remoto

A suíte `npm run check` verifica regras de parsing, contratos de integração, estrutura SQL e regressões locais. Executar em homologação o fluxo de salvar e reaplicar modelos no Supabase, confirmar políticas RLS para organizações distintas e inspecionar a interface em desktop e mobile. Não foi possível validar a aplicação da migration em um Supabase real aqui.
