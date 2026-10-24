# V2.59.9 — Hardening, regressões e fechamento da Fase 4

## Objetivo

A V2.59.9 encerra a Fase 4 de Capacidade. O foco não é criar um novo indicador, e sim estabilizar as regras publicadas entre V2.59.0 e V2.59.8 antes da abertura da Fase 5 — Resultado.

## Hardening do histórico

### Revisão determinística

O histórico passa a selecionar defensivamente apenas uma linha por competência e escopo:

- competência reaberta: a `live_preview` prevalece sobre qualquer fotografia congelada daquela competência;
- competência fechada: vence a maior revisão persistida;
- empate defensivo: `close` prevalece sobre `legacy_backfill`.

Assim, a leitura não depende da ordem em que a RPC ou o cliente recebeu as linhas.

### Fail-closed de cobertura

Um snapshot só pode alimentar referência histórica de resolução ou atendimento quando o contrato completo estiver coerente. O motor deixa de confiar apenas no booleano `complete` recebido e revalida:

- revisão e revisão financeira coerentes;
- versão do snapshot e versão da regra presentes;
- disponibilidade completa;
- FTE disponível não superior ao FTE nominal;
- ausência de pessoas sem disponibilidade;
- ausência de base de resolução/atendimento faltante;
- ausência de linhas inconsistentes;
- FTE disponível maior que zero;
- volumes e razões por FTE explicitamente presentes.

Quando qualquer item falha, o indicador histórico permanece indisponível em vez de produzir referência parcial.

### Compatibilidade entre camadas

A normalização do motor passa a reconhecer tanto os nomes vindos diretamente da RPC quanto os nomes já normalizados por `strategy-data.js`, incluindo `usedCapacityMissing` e `inconsistentRows`. Isso impede que faltantes ou inconsistências sejam perdidos entre a camada de dados e o motor de capacidade.

## Integridade do FTE

Se uma entrada histórica informar FTE disponível acima do FTE nominal, o valor exibível é limitado ao nominal, mas a cobertura é invalidada. A linha não participa de referência, FTE necessário, gap ou diagnóstico histórico.

## Banco de dados

Executar:

`supabase/migrations/MIGRACAO_V2.59.9.sql`

A migration reforça os snapshots criados pela V2.59.8:

- remove leitura direta da tabela para `authenticated`; o histórico continua exposto apenas pela RPC agregada autorizada;
- adiciona contratos `NOT VALID` entre colunas e payload JSON para versão, regra, origem e revisões;
- exige `operation` como objeto e `squads` como array para novos snapshots;
- torna a fotografia histórica imutável com trigger que bloqueia `UPDATE` e `DELETE`.

`NOT VALID` evita bloquear a implantação por legado já gravado, mas protege novos registros imediatamente.

## Regressões cobertas

A suíte da V2.59.9 valida, em conjunto:

1. Fundação e filtros da V2.59.0;
2. FTE disponível da V2.59.1;
3. Capacidade utilizada da V2.59.2;
4. Utilização/ociosidade/sobrecarga da V2.59.3;
5. Produtividade por FTE da V2.59.4;
6. FCR e FTE necessário da V2.59.5;
7. Gap de capacidade da V2.59.6;
8. Diagnósticos da V2.59.7;
9. Snapshots e evolução da V2.59.8;
10. seleção de revisão, reabertura, cobertura parcial, contrato de snapshot e imutabilidade da V2.59.9.

## Motor

Regra corrente:

`CA-1.0.0-phase4-hardening`

O formato persistido do snapshot continua:

`CS-1.0.0`

O snapshot não mudou de formato; o hardening reforça como ele é validado e consumido.

## Critério de saída da Fase 4

A Fase 4 pode ser considerada encerrada quando:

- `npm run check` estiver integralmente verde;
- a migration V2.59.9 estiver aplicada após a V2.59.8;
- fechamento e reabertura forem validados em ambiente conectado ao Supabase;
- uma nova revisão fechada gerar snapshot oficial sem permitir alteração retroativa.
