# R27 - Movimentação de Pré-atendimento para Suporte e modais com zoom

## Escopo
- Permite converter conta ativa de Pré-atendimento para Técnico de Suporte (A/B/D/E) mantendo login, e-mail e `user_id`, com competência efetiva **atual**.
- Mantém a pessoa histórica do Squad C e suas referências financeiras (mesmo `person_id`), desvinculando-a do login; cria nova pessoa estratégica de Suporte para competências seguintes, e cria o primeiro vínculo operacional em `profile_squad_history`.
- Opera em transação SQL server-side; impede destino fechado e conflito de vínculo. Não modifica vendas, custos, snapshots ou registros de atendimentos já importados.
- Modal de cadastro/edição de usuários possui rolagem e barra de ações fixa para zoom alto.
- **Não** libera conversão inversa Técnico para Pré-atendimento.

## Ordem obrigatória de aplicação
1. Faça backup do banco e teste em homologação.
2. Execute `supabase/migrations/MIGRACAO_V2.63.18_MOVIMENTACAO_PRE_ATENDIMENTO_R27.sql` no SQL Editor, com conta administrativa do projeto.
3. Republicar a Edge Function `supabase/functions/manage-user/index.ts` pelo seu fluxo de deploy habitual. A migration é chamada somente por `service_role` dentro da função após autenticação e autorização de administrador.
4. Publicar os arquivos frontend `js/app.js`, `css/styles.css`, `index.html`, `package.json` e novos testes se fizer parte do repositório.
5. Abrir a tela Usuários, editar conta do Pré-atendimento, escolher Técnico + Squad destino, nome do CSV, competência atual e Salvar.
6. Testar em conta de suporte; conferir Histórico, Estratégico C, Estratégico B e indicadores antigos. Confirmar que os botões estão acessíveis com 150%/200% de zoom.

## Pontos de atenção
- Competência de conversão permitida: **mês corrente no fuso de São Paulo**, por segurança de históricos. Para mês passado é necessária análise específica de impacto dos fechamentos e dos lançamentos já realizados.
- A pessoa estratégica antiga continua consultável com papel `Pré-atendimento (histórico)` e `user_id = NULL`; por segurança não pode participar de novas importações autenticadas. Administradores devem evitar lançar novas vendas manuais nessa identidade histórica.
- As tabelas antigas de vendas e custos mantêm seus IDs e dados; algumas consultas legadas que dependem do perfil atual (em vez de snapshots históricos) ainda devem ser validadas com a base real na homologação.
- A criação de aliases técnicos sucede a conversão. Se o cadastro de aliases falhar, o usuário já foi transferido e é exibida orientação para conferir os aliases antes da próxima importação.
- Não é possível executar os testes de constraints e RLS do Supabase de produção offline. Os testes do projeto são automatizados locais.

## Testes
`npm run check` - 1.146 testes aprovados (0 falhas) na base R26 com R27 aplicada. Sem validação de produção.

## Commit
`feat: permite migrar pre-atendimento para suporte e corrige zoom dos modais (R27)`
