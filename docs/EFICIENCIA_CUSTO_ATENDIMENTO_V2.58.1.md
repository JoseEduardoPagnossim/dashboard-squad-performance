# V2.58.1 — Custo por Atendimento

## Objetivo
Entregar o primeiro indicador econômico da Fase 3 usando as duas bases já consolidadas no painel: custo estratégico e produção operacional.

## Fórmula oficial

`custo por atendimento = custo total consolidado / atendimentos válidos`

O cálculo sempre respeita a mesma competência e o mesmo escopo de Squad. Quando não existe atendimento válido, o indicador fica sem valor em vez de dividir por zero.

## Níveis de leitura

- **Operação/escopo selecionado:** custo total consolidado dividido pelos atendimentos do mesmo escopo.
- **Squad:** custo de pessoas + custo operacional rateado do Squad, dividido pelos atendimentos do Squad.
- **Técnico:** custo pessoal atribuído ao técnico dividido pelos atendimentos vinculados ao seu `user_id` operacional.

Custos operacionais compartilhados não são rateados novamente até o técnico nesta versão. Isso evita criar uma regra individual arbitrária antes da fase de produtividade econômica.

## Comparação
A tela respeita o seletor estratégico de comparação:

- mês anterior;
- média das 3 competências anteriores;
- média das 6 competências anteriores;
- média das 12 competências anteriores.

A variação negativa do custo por atendimento é tratada como melhora econômica, mas não substitui indicadores de qualidade.

## Exclusão de pessoas dos custos
A tabela de Pessoas e Custos passa a oferecer **Excluir dos custos**.

A ação:

- não altera o usuário operacional;
- não apaga atendimentos, ranking ou bonificação;
- marca a pessoa como inativa apenas na base `strategy_people`;
- remove os custos pessoais das competências estratégicas ainda abertas;
- preserva competências fechadas e seus snapshots;
- impede que a sincronização automática recrie o técnico, pois o vínculo estratégico inativo continua registrado.

## Banco de dados
Não há migration nova na V2.58.1. A funcionalidade utiliza colunas e políticas já existentes desde as migrations da Gestão Estratégica.
