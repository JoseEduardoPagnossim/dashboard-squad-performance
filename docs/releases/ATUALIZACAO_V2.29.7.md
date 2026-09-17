# Soften Performance Hub V2.29.7

## Qualidade automatizada e testes financeiros

A V2.29.7 adiciona uma camada de proteção para futuras alterações no painel sem mudar as regras financeiras vigentes.

### O que mudou

- As funções financeiras puras foram centralizadas em `js/finance-rules.js`.
- `js/app.js` passou a consumir esse módulo para os cálculos críticos, evitando que os testes validem uma cópia desconectada da regra usada pela aplicação.
- Foi criada a suíte `tests/finance-rules.test.js` utilizando apenas o test runner nativo do Node.js.
- Foi criado o workflow `.github/workflows/quality.yml` para executar validação e testes automaticamente no GitHub.
- O validador do projeto agora confirma também que o módulo financeiro existe e é carregado antes do `app.js`.

### Regras protegidas por teste

A suíte valida, entre outros cenários:

- faixas de comissão por atendimentos/dia;
- faixas de comissão por percentual de Notas 5;
- faixas e multiplicador de cancelamento;
- status financeiro pela regra de 2 dos 4 critérios;
- divisão dos prêmios em caso de empate;
- desconto dos técnicos ABAIXO e redistribuição entre técnicos ACIMA elegíveis;
- isenção de competência parcial no pool financeiro;
- piso zero do modelo Individual;
- comportamento atual da Base do Squad;
- redutor de 50% em férias;
- teto global do modelo Individual e rateio exato em centavos.

### Como validar localmente

Com Node.js 20 ou superior:

```bash
npm ci
npm run check
```

### GitHub Actions

O workflow **Quality Gate** é executado automaticamente em `push` e Pull Request para a branch `main`. Também pode ser iniciado manualmente em **GitHub > Actions > Quality Gate > Run workflow**.

### Banco de dados

Esta versão não possui alteração de schema, Edge Function ou migration. O banco permanece compatível com a estrutura consolidada até a V2.29.6.
