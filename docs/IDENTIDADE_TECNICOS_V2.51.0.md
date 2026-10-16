# V2.51.0 — Identidade estável de técnicos

## Objetivo

Evitar que uma alteração de nome no CRM/CSV crie uma segunda pessoa no histórico de performance. A partir desta versão, o nome deixa de ser tratado como identidade principal sempre que o técnico possui um usuário cadastrado no Performance Hub.

## Identidade

- `profiles.user_id` é a identidade estável do técnico.
- `technician_name` continua sendo o nome atual exibido e esperado no CRM, mas passa a funcionar como rótulo.
- `technician_aliases` registra nomes atuais, anteriores e alternativos aceitos durante a importação.
- Um alias pode existir em mais de um cadastro, mas nesse caso a importação é bloqueada como ambígua até o Administrador corrigir o vínculo. O sistema não faz aproximação automática por semelhança de nome.

## Alteração do nome do CSV

Na edição do usuário, **Nome atual do técnico no CSV** mostra o nome vigente. O campo **Nomes anteriores / aliases do CSV** permite manter nomes históricos, um por linha.

Quando o Administrador troca o nome atual, o nome anterior é salvo como alias antes da alteração do perfil. Isso permite que arquivos antigos e novos continuem apontando para o mesmo `user_id`.

A migration também tenta recuperar aliases existentes a partir de:

- nome atual e nome completo do perfil;
- histórico de movimentação de Squad;
- linhas mensais já vinculadas por `user_id`;
- auditoria de alterações de usuário.

## Importação operacional

Antes de calcular a competência, cada nome do CSV é resolvido para uma identidade estável. Linhas com nomes diferentes que apontam para o mesmo `user_id` são consolidadas antes da soma de atendimentos e avaliações.

A prévia informa quando um alias foi utilizado. Vínculos ambíguos são bloqueados; nomes não reconhecidos continuam sendo informados para correção no cadastro.

## Reconciliação de competência já duplicada

A migration **não soma nem mescla métricas antigas automaticamente**, porque uma linha duplicada pode já conter os mesmos atendimentos da outra linha. A correção segura é reimportar o CSV operacional da competência.

Durante essa reimportação o sistema:

1. reconstrói atendimentos e avaliações usando o CSV como fonte de verdade;
2. identifica linhas mensais da mesma pessoa por `user_id`/alias;
3. mantém uma única linha mensal;
4. preserva dados manuais/financeiros existentes da pessoa;
5. remove as linhas duplicadas;
6. recria o detalhamento diário e recalcula ranking/pontuação.

Por isso, para uma competência que já ficou com dois nomes da mesma pessoa, cadastre/confirme o alias e reimporte o CSV operacional do mês.

## Qualidade Produto/Empresa

O reconhecimento de técnicos na importação de qualidade também considera os aliases. Se a competência operacional ainda possuir dois registros da mesma pessoa, faça primeiro a reimportação operacional para reconciliar a identidade e depois reimporte a qualidade, se necessário.

## Banco de dados

Execute `supabase/migrations/MIGRACAO_V2.51.0.sql` uma única vez em bases existentes. Ela cria `technician_aliases`, índices e policies por organização e semeia aliases conhecidos. Não é necessário republicar Edge Functions nesta versão.
