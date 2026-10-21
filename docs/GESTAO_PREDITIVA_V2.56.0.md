# V2.56.0 — Gestão preditiva por Squad

## Objetivo

Corrigir e proteger o escopo da Gestão Preditiva para que todos os elementos do bloco usem o mesmo Squad selecionado, sem alterar as regras das abas de Desempenho, Meu Desempenho, Visão do Squad, importações, bonificação ou filtros globais.

## Escopo e regra de dados

A Gestão Preditiva passa a aplicar uma segunda validação de escopo dentro do próprio motor preditivo:

- **Todos os Squads:** consolida os Squads recebidos pela tela;
- **Squad específico:** mantém somente o código selecionado;
- um código não disponível no conjunto recebido não reaproveita dados de outro Squad.

Cards, alertas, tabela de projeção e técnicos em risco partem da mesma coleção filtrada. Assim, o valor consolidado dos cards corresponde às linhas que compõem a tabela por Squad.

## Hierarquia dos cards

A tela passa a destacar a informação que é exclusiva da visão preditiva:

- **Projeção de atendimentos:** projeção em destaque; realizado e meta como contexto;
- **Projeção de Notas 5:** projeção em destaque; realizado e meta como contexto;
- **Tendência de avaliação:** taxa atual/tendência em destaque, sem crescimento artificial por dias úteis;
- **Técnicos sob risco:** exibe `quantidade em risco de total`, representatividade da equipe e o critério de `2+ sinais`.

Quando a meta de Notas 5 já foi atingida, o apoio deixa de exibir `0 por dia útil` e informa quanto a meta foi superada. Se ainda não foi atingida, mantém a leitura de ritmo necessária.

## Contexto visível

O chip da Gestão Preditiva passa a exibir o escopo junto da competência e dos dias úteis, por exemplo:

`Squad A • Outubro 2026 • 14/22 dias úteis`

Isso deixa explícito que a projeção usa a competência de referência, mesmo quando o restante da aba possui um intervalo de análise global.

## Compatibilidade

- frontend-only;
- sem migration;
- sem alteração das fórmulas financeiras;
- sem alteração da lógica de Desempenho, Meu Desempenho ou Visão do Squad;
- sem alteração de importação ou persistência;
- filtros globais continuam sendo a fonte do contexto; a Gestão Preditiva apenas valida o escopo novamente antes de agregar os dados.

## Proteção por testes

A versão adiciona testes para garantir que:

- `Todos os Squads` mantém o consolidado;
- um Squad específico retorna somente seu próprio escopo;
- código inexistente não reaproveita outro Squad;
- cards e tabela são derivados do mesmo conjunto filtrado;
- a nova semântica dos cards está publicada;
- a alteração continua frontend-only e preserva os módulos existentes.
