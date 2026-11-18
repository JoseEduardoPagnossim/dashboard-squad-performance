# R30.1 — Prefixo de CNPJ visível na revisão de negociações

- Na etapa condicional de revisão R30, cada grupo candidato exibe os **7 primeiros dígitos do CNPJ** usados no agrupamento.
- Exibição temporária somente no navegador durante a revisão; o prefixo não entra no payload nem é persistido na tabela de negociações.
- Não exibe o CNPJ completo. Este prefixo não é uma identificação única e exige confirmação do administrador.
- Sem alterações no Supabase ou regras de cálculo.

## Aplicação

Publicar `index.html`, `js/app.js` e `js/strategy-recurring-import.js` sobre a R30 instalada. Atualizar com Ctrl+Shift+R. Não executar SQL.
