# V2.57.0 — Fundação da Gestão Estratégica

## Objetivo

Criar uma nova área estratégica sem modificar as regras do dashboard operacional existente.

## Escopo entregue

- rota independente `?page=strategy&section=...`;
- seções `executive`, `costs` e `assumptions`;
- estado estratégico mantido fora do `state` operacional;
- filtros internos de competência, Squad e comparação, sem alterar os filtros globais;
- módulos próprios em `js/strategy-*.js`;
- stylesheet próprio `css/strategy.css`;
- autorização independente em `strategy_access`;
- tela funcional de fundação, ainda sem salários/custos reais;
- motor financeiro estratégico criado apenas como ponto de extensão, sem cálculos oficiais nesta versão.

## Isolamento

A Gestão Estratégica pode ler a lista de Squads e competências existentes para montar seu contexto, mas não altera `state.squads`, `state.squadCode`, `state.currentId` ou o período operacional.

## Acesso

A migração `MIGRACAO_V2.57.0.sql` cria `strategy_access` com permissões separadas para:

- visualizar a área estratégica;
- visualizar agregados;
- visualizar custos individuais de pessoas;
- editar custos;
- fechar competências;
- administrar acessos.

No bootstrap, administradores atuais recebem apenas acesso à fundação/agregados e administração de acesso. Custos individuais, edição e fechamento permanecem desabilitados.

## Próxima etapa

V2.57.1: competências estratégicas, cadastro de pessoas e custos pessoais por competência.
