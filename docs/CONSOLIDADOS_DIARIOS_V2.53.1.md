# V2.53.1 — Consolidados diários por período e scroll do seletor

## 1. Consolidados diários

Os gráficos organizacionais diários usavam RPCs que retornavam todo o histórico, ordenado da competência mais antiga para a mais recente. Com quatro Squads, aproximadamente 250 dias já representam 1.000 linhas, podendo interromper a série no meio de uma competência.

A V2.53.1 cria duas RPCs por intervalo:

- `get_org_daily_attendance_overview_range(date,date)`;
- `get_org_technician_daily_overview_range(date,date)`.

O frontend envia `analysisStartDate` e `analysisEndDate`, pagina a resposta em blocos de até 900 linhas e associa o cache diário ao intervalo solicitado. Alterar o Período de análise força a atualização desse cache sem recarregar desnecessariamente os consolidados mensais.

As RPCs preservam o isolamento pela organização do usuário autenticado e não expõem informações financeiras.

## 2. Central de Importação

Os selects do Design System usam um menu portal com rolagem própria. O listener global de `scroll` fechava qualquer select aberto inclusive quando o evento era originado pelo próprio menu, tornando difícil/impossível alcançar opções localizadas no final da lista.

A V2.53.1 ignora o `scroll` originado dentro do menu aberto. Rolagens externas (página, modal ou viewport) continuam fechando o select para evitar desalinhamento do portal.

## 3. Banco de dados

Execute `supabase/migrations/MIGRACAO_V2.53.1.sql` uma vez em bases existentes. Não é necessário republicar Edge Functions.
