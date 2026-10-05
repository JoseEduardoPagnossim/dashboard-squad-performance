# V2.45.2 — Filtros superiores e importação do CSV deduplicado

## Objetivo

A V2.45.2 corrige dois comportamentos observados após a V2.45.1:

1. controles do filtro superior apareciam em telas que não consumiam aquele contexto e, em alguns módulos, um filtro necessário ficava oculto;
2. o importador de **Indicadores > Impacto financeiro** exigia nomes de colunas rígidos e podia interpretar a diretiva `sep=;` do Excel como cabeçalho.

Não há migration de banco nesta versão.

## Matriz dos filtros superiores

A visibilidade passa a ser definida por uma única rotina (`topFilterVisibility` / `syncTopFiltersForView`) para impedir que `showView()` e `applyPermissions()` sobrescrevam um ao outro.

| Tela / módulo | Squad | Mês | De / Até | Técnico |
| --- | --- | --- | --- | --- |
| Início | — | — | — | — |
| Meu desempenho | quando Admin | — | sim | quando Admin e Squad específico |
| Visão do Squad | quando Admin | — | sim | — |
| Indicadores gerais / qualidade / dias úteis / detalhe | quando Admin | — | usa o filtro interno do módulo | — |
| Indicadores > Impacto financeiro | — | — | — | — |
| Apresentação | quando Admin | — | sim | — |
| Feedbacks | quando Admin | sim | — | — |
| Gestão > Operação | quando Admin | sim | — | — |
| Gestão > Bonificação | quando Admin | sim | — | — |
| Gestão > Aparência | quando Admin | — | — | — |
| Gestão > Custos | — | — | — | — |
| Configurações | quando Admin | — | — | — |
| Usuários / Auditoria / Perfil / Ajuda | — | — | — | — |

### Correções relevantes

- **Apresentação** volta a exibir `De / Até`, pois seus dados já usam `analysisStartDate` e `analysisEndDate`.
- **Impacto financeiro** deixa de exibir Squad, pois a leitura é corporativa para o Suporte técnico completo.
- **Aparência** mantém Squad, mas não exibe Mês, que não participa da configuração visual.
- Usuários, Auditoria, Perfil e Ajuda deixam de exibir controles sem efeito.
- `applyPermissions()` deixa de possuir uma segunda regra concorrente para os filtros e passa a reutilizar a mesma rotina central.

## CSV deduplicado — cabeçalhos aceitos

As quatro dimensões continuam obrigatórias; a validação não foi removida. O importador agora reconhece nomes equivalentes usados nas bases reais.

### Data da avaliação

Aceitos:

- `DataAvaliacao`
- `Data Avaliação`
- `Data da Avaliação`
- `Time`
- `Data`

### Nota de Serviço

Aceitos:

- `NotaServico`
- `Nota Serviço`
- `Nota Atendimento`

### Produto

Aceitos:

- `NotaProduto`
- `Nota Produto`

### Empresa

Aceitos:

- `NotaEmpresa`
- `Nota Empresa`

O comparador ignora acentos, espaços e diferenças de maiúsculas/minúsculas.

## CSV salvo pelo Excel

Arquivos que iniciam com uma linha como:

```text
sep=;
```

também são aceitos. Essa linha agora é reconhecida como diretiva de separador e removida antes da leitura do cabeçalho.

## Mensagem de erro

Quando alguma dimensão obrigatória realmente estiver ausente, a mensagem passa a informar:

- qual campo semântico está faltando;
- quais nomes são aceitos para ele;
- quais cabeçalhos foram encontrados no arquivo.

Isso evita o erro genérico anterior, que mostrava apenas o nome interno normalizado da coluna.

## Validação

A suíte automatizada inclui cobertura para:

- cabeçalho original da V2.29;
- alias `Time`;
- alias `Data Avaliação`;
- alias `Nota Atendimento`;
- rejeição de arquivo realmente incompleto;
- presença do tratamento de `sep=;`;
- matriz centralizada dos filtros superiores.
