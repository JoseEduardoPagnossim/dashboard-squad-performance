# V2.46.0 — Central de Alertas + notificações internas

## Objetivo

Centralizar no Performance Hub dois tipos de sinal que antes ficavam separados:

1. **Alertas automáticos**, calculados a partir dos dados já carregados no painel;
2. **Notificações internas**, publicadas por Administradores e entregues aos usuários conforme o público definido.

A solução não envia e-mail, WhatsApp ou push do navegador. O escopo da V2.46 é comunicação **dentro do Performance Hub**.

## Experiência do usuário

O topo do sistema passa a ter um sino com contador de itens não lidos. Ao abrir o sino, o usuário vê os itens mais recentes e pode:

- marcar um item como lido;
- marcar todos como lidos;
- executar a ação associada ao alerta, quando houver;
- abrir a Central de Alertas completa.

A Central de Alertas permite filtrar por:

- lido / não lido;
- automático / interno;
- prioridade;
- categoria;
- texto livre.

## Alertas automáticos

Os alertas automáticos não criam uma nova fonte de verdade. Eles usam indicadores que o projeto já possui.

Para Administradores, a V2.46 pode sinalizar por Squad:

- projeção de atendimentos abaixo da meta;
- projeção de notas 5 abaixo da meta;
- percentual de avaliação abaixo da referência;
- técnicos em atenção conforme a leitura de risco já usada na Home/Gestão Preditiva;
- competência sem dados para algum Squad.

Para Técnicos, a Central usa os sinais pessoais de ritmo e risco já calculados pelo dashboard.

A leitura desses itens automáticos é persistida localmente no navegador porque o alerta é derivado dos dados e não precisa gerar uma linha própria no banco.

## Notificações internas

Administradores podem publicar comunicados com:

- título e mensagem;
- prioridade: Informativa, Atenção, Crítica ou Positiva;
- categoria: Comunicado, Operação, Performance, Feedback ou Sistema;
- público: Todos, Administradores, Todos os Técnicos ou Squad específico;
- início da exibição;
- expiração opcional;
- botão opcional para abrir uma área do próprio Performance Hub.

A publicação é auditada. O encerramento também é auditado e apenas desativa a notificação; a linha permanece disponível para histórico administrativo.

## Leitura individual

A tabela `internal_notification_reads` registra a leitura por usuário. Isso permite que o contador do sino seja diferente para cada pessoa sem alterar a notificação original.

## Segurança / RLS

A migration V2.46 cria:

- `public.internal_notifications`;
- `public.internal_notification_reads`.

Regras principais:

- Administradores podem consultar e administrar notificações da própria organização;
- Técnicos recebem somente notificações válidas destinadas a Todos, Técnicos ou ao próprio Squad;
- cada usuário consulta e grava apenas as próprias leituras;
- notificações de outra organização não são acessíveis;
- publicação e encerramento exigem Administrador.

## Permissões

Novas permissões da aplicação:

- `notifications.view`: Administrador e Técnico;
- `notifications.manage`: somente Administrador.

## Instalação / atualização

Execute no SQL Editor do Supabase:

```sql
-- conteúdo de supabase/migrations/MIGRACAO_V2.46.0.sql
```

Depois publique os arquivos da V2.46.0 e faça `Ctrl + F5`.

Se a migration ainda não estiver aplicada, a tela continua mostrando os **alertas automáticos**, mas informa que as notificações internas estão indisponíveis até a atualização do banco.

## Modo demonstração

Sem Supabase, notificações publicadas e leituras são guardadas em `localStorage`, permitindo validar toda a interface sem banco remoto.
