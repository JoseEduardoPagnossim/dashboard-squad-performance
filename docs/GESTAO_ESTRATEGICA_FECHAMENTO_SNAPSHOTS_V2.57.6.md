# Gestão Estratégica — Fechamento e snapshots V2.57.6

## Objetivo

Transformar uma competência financeira em uma fotografia auditável. Após o fechamento, os números estratégicos daquele mês deixam de depender de alterações posteriores nos dados operacionais ou nas premissas financeiras.

## Permissão

A permissão `can_close_competence` é independente do acesso geral à Gestão Estratégica. No Controle de Usuários o Super Admin pode habilitar **Fechar competências**. A opção nasce desmarcada.

## Fluxo

1. A competência começa como `draft` ou `provisional`.
2. Custos pessoais, custos operacionais e rateios são editáveis conforme `can_edit_costs`.
3. Antes de fechar, o sistema valida se não existem custos operacionais não alocados e se os rateios fecham com o valor dos lançamentos.
4. A RPC `close_strategy_competence` grava um snapshot e muda a competência para `closed`.
5. Custos e rateios ficam bloqueados por UI e RLS.
6. Resultado Executivo, resumo financeiro, consolidação por Squad e histórico passam a usar o snapshot.
7. Se for necessária uma correção, `reopen_strategy_competence` volta a competência para `provisional`, preservando o snapshot anterior.
8. Um novo fechamento cria `revision + 1`; nenhuma revisão anterior é sobrescrita.

## Conteúdo do snapshot

O snapshot registra os totais financeiros, consolidação por Squad, custos pessoais, custos operacionais, rateios, FTE, atendimentos, qualidade, versão do snapshot, versão do motor financeiro, versão dos insights e fingerprint do conteúdo.

Versões iniciais:
- snapshot: `SS-1.0.0`;
- motor: `SC-0.6.0-snapshot`;
- insights: `SI-1.1.0`.

## Segurança

A tabela de snapshots não expõe leitura direta para usuários comuns por política RLS. As telas consomem RPCs agregadas. Competências fechadas bloqueiam INSERT/UPDATE/DELETE nas tabelas de custos pessoais, custos operacionais e rateios.
