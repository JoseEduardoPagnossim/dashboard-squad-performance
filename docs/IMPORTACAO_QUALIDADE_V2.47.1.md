# V2.47.1 — Correção da importação de Produto/Empresa

## Causa
A V2.45.2 flexibilizou os cabeçalhos do importador de Impacto Financeiro, mas a Central de Importação de qualidade permaneceu exigindo literalmente `Time`. Arquivos válidos com `DataAvaliacao` eram reconhecidos como qualidade e rejeitados na etapa seguinte.

## Formato aceito
A coluna de data pode ser `Time`, `DataAvaliacao`, `Data Avaliação`, `Data da Avaliação` ou `Data`. A coluna de técnico pode ser `nomeApresentativo`, `Técnico`, `Tecnico` ou `Atendente`. `NotaProduto` e `NotaEmpresa` continuam obrigatórias. `NotaServico` pode existir no arquivo, mas é ignorada nessa importação.

## Validação real
Foi utilizado o arquivo de setembro de 2026 enviado para diagnóstico, com cabeçalho `DataAvaliacao;nomeApresentativo;NotaServico;NotaProduto;NotaEmpresa`. O parser reconheceu todas as colunas e 1.706 linhas de dados. A linha final vazia delimitada por ponto e vírgula é descartada normalmente.

## Banco de dados
Não exige migration nova.

## Testes
A suíte completa do projeto foi executada após a correção: **167/167 testes aprovados**.
