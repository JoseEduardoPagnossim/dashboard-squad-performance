# V2.63.2 — Conciliação de pessoas e Squads (Fase 8)

## Objetivo e entrega

Gestão Estratégica → Automação → Importador CSV → **Conciliação de vendedores e Squads**. Utiliza a prévia dos CSVs da V2.63.1 para agrupar vendas por origem, Squad e nome normalizado. Exibe as linhas elegíveis, conciliadas, pendentes, ambíguas e ignoradas por ausência de grupo ou vendedor. **Não contabiliza receitas, não calcula comissão nem altera competências/snapshots.**

- O vendedor é identificado pela conta ativa de `profiles`, vinculada à pessoa ativa `strategy_people.user_id` no **mesmo organization_id**. Não é permitido associar vendedores só pelo nome sem ID persistente.
- Os Squads A, B, D, E exigem uma conta `technician` ativa e uma pessoa estratégica vinculada a esse Squad, fora da equipe funcional de Pré-atendimento.
- O Squad C exige uma conta `pre_attendance` ativa e uma pessoa estratégica com `functional_team='pre_attendance'` e `default_squad_code='C'`. Não gera dados operacionais de Suporte.
- `UsuarioVenda` / `Vendedor` com nome normalizado exatamente igual ao da pessoa ou do perfil, e correspondência **única** no mesmo Squad, é vinculado automaticamente para a prévia. Semelhantes, homônimos e dados inconsistentes permanecem pendentes/ambíguos.
- Linha com grupo ausente/inválido não participa da conciliação nem poderá entrar nas futuras importações financeiras; o arquivo original não é alterado. Linha com grupo válido e vendedor ainda não conciliado não é descartada: permanece pendente.
- Um alias é registrado somente após escolha explícita do vendedor do CSV e da pessoa estratégica do **mesmo Squad**, por organização e origem. Não modifica a identidade da pessoa ou a conta. Um alias existente que aponte para pessoa inativa ou incompatível não é aplicado.
- A atualização de um alias pela RPC altera sua definição para importações futuras, com `updated_by` e `updated_at`. O histórico financeiro não é reescrito. A V2.63.4/5 precisará persistir a referência `person_id` e o snapshot da atribuição por venda.
- O CSV continua no navegador: o Supabase recebe apenas alias, origem, Squad e ID da pessoa selecionada, jamais as linhas completas, valores das vendas ou dados de clientes. A lista de contas/perfil é obtida com a política de acesso já existente.

## Banco e acesso

Executar `supabase/migrations/MIGRACAO_V2.63.2.sql` **após** as migrations V2.63.0 e V2.63.1. Nova tabela `strategy_seller_aliases`, com chave única por `(organization_id,source_key,squad_code,alias_normalized)`, RLS de leitura por organização e permissões `people_costs` e `edit_costs`. Sem permissão de escrita direta a `authenticated`; gravação exclusivamente via RPC `upsert_strategy_seller_alias_v2632` (security definer, autorizando organização, pessoa, conta, equipe, perfil, Squad e nome normalizado). O frontend nunca envia organization_id a essa RPC; ela obtém a organização da sessão autenticada.

Se a migration não estiver aplicada, o sistema continuará exibindo a prévia dos nomes, mas o cadastro de aliases estará desabilitado e mostrará instruções para executar a migration.

## Passos para homologar

1. Fazer backup de banco e código. Publicar o ZIP incremental sobre V2.63.1.
2. Executar `MIGRACAO_V2.63.2.sql` no SQL Editor de homologação; não são necessárias Edge Functions adicionais.
3. Executar `npm run check`; verificar `2.63.2-r1` em todas as referências JS/CSS do HTML.
4. Abrir Gestão Estratégica → Automação com gestor autorizado; carregar o CSV de contratação e depois o de mercadorias.
5. Conferir contagens: grupo em branco ignorado, Squad C atribuído somente a Pré-atendimento, nomes divergentes pendentes, nomes idênticos e unívocos conciliados.
6. Criar alias para um vendedor pendente selecionando pessoa do mesmo Squad; salvar. Confirmar que a próxima leitura o aplica automaticamente.
7. Testar uma conta `technician` inativa, pessoa sem `user_id`, um homônimo, pessoa em organização diferente e tentativa de gravar alias em outro Squad; nunca associar indevidamente.
8. Testar com outra organização e usuário sem `people_costs`/`edit_costs`: RLS e RPC devem negar leitura/escrita.
9. Verificar que não apareceram novos registros em receitas, custos, comissões, batches financeiros ou snapshots.

**Limites**: não há importação financeira em V2.63.2, e nenhuma migração automática de históricos existentes; isso será tratado nas versões posteriores. A aplicação de SQL em banco real e os testes de interface desktop/mobile devem ser homologados no seu ambiente Supabase. Não há APIs nesta fase.
