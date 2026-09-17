# Soften Performance Hub V2.29.8

## Auditoria e proteção de operações críticas

A V2.29.8 adiciona rastreabilidade administrativa sem criar um ambiente de homologação separado. O objetivo é reduzir o risco operacional na produção, mantendo o fluxo atual de backup + Git + Quality Gate.

## O que mudou

### Auditoria administrativa

Foi adicionada a área **Gestão > Auditoria**, disponível somente para administradores.

Cada evento pode registrar:

- data e hora;
- usuário responsável;
- perfil e escopo;
- ação executada;
- entidade afetada;
- descrição;
- dados anteriores;
- dados posteriores;
- metadados técnicos da operação.

O Admin Geral visualiza os registros da organização. O Admin de Squad visualiza somente registros vinculados ao próprio Squad, conforme RLS.

### Ações registradas

A versão passa a registrar eventos para operações relevantes, incluindo:

- criação, alteração, ativação, inativação e exclusão de usuários;
- importação operacional e importação de Produto/Empresa;
- fechamento, reabertura e exclusão de competência;
- alteração de metas e métricas;
- alteração e cópia de regras financeiras;
- alteração de valores financeiros por técnico;
- comissão do Admin Geral;
- custos gerais do Suporte;
- importação e parâmetros de impacto financeiro.

### Confirmação reforçada

Operações com maior risco de perda ou alteração de histórico exigem confirmação digitada:

- exclusões: digitar `EXCLUIR`;
- reabertura de competência: digitar `REABRIR`.

As alterações financeiras que recalculam resultados exibem uma confirmação explicando o impacto antes da gravação.

### Proteção de dados sensíveis

O frontend sanitiza os objetos de auditoria antes do envio. Campos cujo nome indique senha, token, secret, autorização, `service_role` ou API key não são armazenados no log.

As operações de usuários são auditadas pelas Edge Functions, sem enviar senhas para `audit_logs`.

## Banco de dados

Esta versão possui migração obrigatória para habilitar a auditoria:

```text
supabase/migrations/MIGRACAO_V2.29.8.sql
```

A migração cria:

- tabela `audit_logs`;
- índices de consulta;
- RLS para leitura por organização/Squad;
- RPC `log_audit_event` para registros autenticados e validados no banco.

Não execute `supabase/schema.sql` sobre uma base existente. O `schema.sql` foi atualizado somente para novas instalações.

## Edge Functions

Depois de executar a migração, republique:

```bash
supabase functions deploy create-user
supabase functions deploy manage-user
```

As funções continuam validando sessão e permissão antes de executar as operações e agora registram as alterações de usuários no backend.

## Quality Gate

O GitHub Actions continua executando em `push`, Pull Request e execução manual. A validação agora também confere a presença e integração da auditoria.

Foram adicionados testes para:

- confirmação digitada tolerando caixa/espaços;
- rejeição de confirmação incorreta;
- remoção de dados sensíveis;
- limite de payloads de auditoria;
- categorização e rótulo de eventos.

Os testes financeiros da V2.29.7 permanecem ativos.

## Ordem recomendada para atualização

1. faça o backup normal do banco/projeto;
2. execute `MIGRACAO_V2.29.8.sql` no Supabase;
3. republique `create-user` e `manage-user`;
4. publique os arquivos do frontend;
5. execute `npm run check` ou confirme o Quality Gate verde no GitHub;
6. teste uma ação administrativa simples e confirme o registro em **Gestão > Auditoria**.
