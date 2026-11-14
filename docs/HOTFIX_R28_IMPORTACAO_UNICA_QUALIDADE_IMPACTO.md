# R28 — Uma importação Produto/Empresa para Qualidade e Impacto Financeiro

## Objetivo
Ao confirmar `Operação → Importar CSV Produto/Empresa`, utilizar o mesmo CSV preparado para atualizar a qualidade por técnico e a **competência selecionada** em `Indicadores → Impacto financeiro`. Não solicitar um segundo upload do mesmo relatório.

## Condições para apuração financeira confiável
- A importação deve ser realizada por superadministrador, com a competência de destino aberta no fluxo de qualidade.
- Na preparação do CSV, habilitar deduplicação por **uma única coluna estável de cliente** (ID cliente, CPF, CNPJ, código cliente, documento ou nome cliente, observando possíveis homônimos).
- Mapear `Nota Serviço` no CSV de origem, além das notas Produto e Empresa. Sem a coluna Serviço, o risco conjunto das três dimensões não pode ser calculado de forma comparável e a sincronização é ignorada, sem apagar dados já existentes.
- Não pode haver avaliações elegíveis sem identificador do cliente. Nesse caso, a sincronização financeira é ignorada para evitar uma contagem parcial apresentada como completa.
- Somente as linhas vinculadas aos Squads da importação operacional são consideradas no agregado financeiro. Vendedores de fora do escopo não são importados.

## Regras do fluxo
1. Deduplicação por identificador de cliente + competência ocorre na preparação já existente da Qualidade. O mesmo conjunto de linhas retidas é usado no financeiro.
2. As linhas passam pela conciliação de técnico e Squad já existente. Somente os registros vinculados entram no agregado financeiro.
3. Após concluir a gravação das avaliações e da sincronização histórica já existente, o sistema atualiza `quality_financial_monthly` para a competência selecionada, com `upsert` em `(organization_id, year, month)`.
4. Mantém `active_clients` e `avg_ticket`; substitui apenas as contagens de clientes e de notas do mesmo mês, sem duplicar.
5. A auditoria registra valores agregados antigos/novos, origem do CSV e competência, sem CPF, CNPJ, nome ou ID do cliente.
6. Falha no bloco financeiro não desfaz a importação da qualidade já concluída; o usuário recebe alerta e a operação grava o motivo em seu histórico.
7. A importação manual da tela financeira permanece como contingência para correções.

## Limitações explícitas
- Dados já importados anteriormente em Produto/Empresa não podem ser convertidos com exatidão a clientes únicos: a gravação original consolidou as avaliações e descartou o identificador de cliente.
- Para preencher novembro/2026 após aplicar o hotfix, reimporte **uma única vez via Operação → Produto/Empresa**, com deduplicação por cliente e Nota Serviço mapeada; não faça a segunda importação em Indicadores.
- Se o CSV contiver múltiplas competências, o financeiro é atualizado para a competência escolhida na confirmação; as demais continuam sujeitas às regras anteriores de qualidade.
- Sem identificador estável, não será gerada uma contagem fictícia de clientes únicos. O cadastro de clientes ativos e ticket médio continua independente.

## Aplicação
1. Criar backup antes da publicação, como prática de implantação.
2. Publicar `js/app.js`, `js/import-engine.js`, `index.html` e `package.json` sobre a R27.
3. Atualizar a página com Ctrl+Shift+R uma vez; versão de cache `2.63.9-r28`.
4. Escolher o CSV Produto/Empresa, selecionar os campos, **identificador do cliente como chave de deduplicação** e `Nota Serviço`, confirmar a competência.
5. Verificar sucesso da qualidade e mensagem de clientes únicos atualizados; abrir `Indicadores → Impacto financeiro` e conferir os valores, sem novo upload.
6. Testar repetição do mesmo arquivo: o agregado da competência deve permanecer igual; cliente ativo e ticket médio também.

## Banco
Sem migration: reutiliza `quality_financial_monthly` e o mecanismo de auditoria já implantados.

## Testes
`npm run check`: 1.147 aprovados, 0 falhas, incluindo quatro testes novos do fluxo R28.

## Commit
`feat: sincroniza impacto financeiro na importacao Produto Empresa (R28)`
