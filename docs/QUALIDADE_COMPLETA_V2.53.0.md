# V2.53.0 — Qualidade Completa sem deduplicação

## Objetivo

Criar uma fonte exclusiva para o gráfico **Qualidade Atendimento × Produto × Empresa** sem alterar as importações operacionais, a importação deduplicada de Produto/Empresa nem o Impacto Financeiro.

## Arquivo esperado

A importação é iniciada somente pelo botão **Importar Qualidade Completa** e aceita CSV não deduplicado com:

- `DataAvaliacao`, `Time`, `Data Avaliação`, `Data da Avaliação` ou `Data`;
- `nomeApresentativo`, `Nome Apresentativo`, `Tecnico`, `Técnico` ou `Atendente`;
- `NotaServico`, `Nota Serviço` ou `Nota Atendimento`;
- `NotaProduto` ou `Nota Produto`;
- `NotaEmpresa` ou `Nota Empresa`;
- `grupoAtendimento`, `Grupo Atendimento`, `Squad` ou `Grupo` opcionalmente.

Cada linha válida representa uma resposta e entra uma única vez. O sistema não remove clientes repetidos.

## Privacidade e persistência

O CSV é consolidado antes da persistência. A tabela `quality_full_daily` guarda somente contagens diárias das notas 1 a 5 por Squad e dimensão, quantidade de linhas da fonte e metadados da importação. Nome, CNPJ ou qualquer identificador de cliente não é armazenado.

## Reimportação

A importação substitui a competência selecionada somente na base de Qualidade Completa. Reimportar o mesmo mês não soma números antigos. As demais competências do arquivo permanecem inalteradas até serem selecionadas e importadas separadamente.

## Vínculo com Squads

Quando `grupoAtendimento` estiver disponível, ele é usado diretamente. Sem essa coluna, o sistema utiliza a identidade estável de técnicos e os aliases do CSV para localizar o Squad da competência, mantendo as mesmas proteções contra vínculo ambíguo.

## Gráfico

Em **Visão do Squad**, o novo card mostra, por competência:

- Qualidade Atendimento: média ponderada de `NotaServico`;
- Qualidade Produto: média ponderada de `NotaProduto`;
- Qualidade Empresa: média ponderada de `NotaEmpresa`.

Cada dimensão considera somente suas notas válidas. Meses sem dados permanecem como lacuna; nenhum valor artificial é criado. O gráfico usa escala focada, rótulos e o fluxo de exportação da V2.52.x.

## Banco de dados

Executar `supabase/migrations/MIGRACAO_V2.53.0.sql` em bases existentes. A migration também amplia `import_batches.kind` para aceitar `quality-full`.
