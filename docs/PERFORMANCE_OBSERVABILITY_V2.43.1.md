# V2.43.1 — Métricas de performance e ajustes finos

## Objetivo

A V2.43.1 não muda a estratégia de carregamento rápido da V2.43.0. Ela adiciona observabilidade para medir o comportamento real do painel em produção e identificar regressões antes que o usuário perceba.

## O que é medido

### Login

O tempo de login considera o intervalo entre o envio do formulário e a interface utilizável. O diagnóstico também preserva as etapas internas do boot, como contexto inicial, preparação do estado e renderização da UI.

### Lazy loading

Carregamentos de competências completas e hidratações de telas são medidos separadamente. Isso permite encontrar uma tela lenta sem concluir incorretamente que o login inteiro está lento.

### Cache

O motor registra hits, misses, itens expirados e gravações. O painel mostra a taxa de hit da sessão atual.

### Long tasks

Quando o navegador oferece `PerformanceObserver` com suporte a `longtask`, tarefas de main thread acima de aproximadamente 50 ms são contabilizadas.

### Erros

Erros globais e promises rejeitadas são registrados com nome, origem simplificada e mensagem curta. Não são enviados stack completo, senha, CSV, dados de clientes ou conteúdo operacional.

## Persistência

A migration `MIGRACAO_V2.43.1.sql` cria `public.app_performance_events`. O frontend não recebe acesso direto à tabela.

- `record_performance_events(jsonb)` grava lotes de até 50 eventos e associa automaticamente usuário e organização pela sessão.
- `get_performance_summary(integer)` retorna somente dados agregados e exige perfil `super_admin`.
- a telemetria é enviada em lotes pequenos e em segundo plano; o login não aguarda a gravação.

## Central de Performance

Em `Configurações → Performance`, o Admin Geral visualiza:

- último login da sessão;
- média e P95 dos logins dos últimos 7 dias;
- taxa de cache hit da sessão;
- quantidade de erros recentes;
- long tasks da sessão;
- etapas do último login;
- módulos mais lentos por média, P95 e máximo;
- erros recentes;
- exportação JSON do diagnóstico.

## Fallback

Se a migration V2.43.1 ainda não estiver aplicada, o sistema continua funcionando. Métricas locais e `window.SoftenPerformanceDiagnostics` permanecem disponíveis, enquanto a Central informa que o histórico do Supabase ainda não está habilitado.

## Segurança e volume

A telemetria foi desenhada para ser pequena. Não registra dados de negócio. O cliente limita metadados e a RPC também limita o lote e o tamanho do metadata. A tabela usa índices por organização/data e organização/tipo/nome.

## Console técnico

`window.SoftenPerformanceDiagnostics` expõe:

- `latest`: último diagnóstico de login;
- `get()`: diagnóstico atual;
- `local()`: métricas locais da sessão;
- `flush()`: força o envio do lote pendente, quando o Supabase está disponível.
