# Regras obrigatórias — Fase 8 (V2.63.0 a V2.63.9)

**Fonte de verdade do projeto.** Ler este documento antes de implementar qualquer versão da Fase 8. O arquivo `AGENTS.md` na raiz referencia estas regras. Não alterar decisões sem pedido explícito do responsável.

## Importação e competência
1. Fontes apenas **CSV e lançamento manual**. APIs ficam para fase futura.
2. CSV **Anotação de Venda / Últimos Produtos Contratados** = vendas efetivas de módulos adicionais. `Vl Atual Ativo` = mensalidade efetivamente adicionada ao plano (**novo MRR**). Desconsiderar `Vl Anterior`.
3. CSV **Vendas de Mercadorias** = vendas avulsas que **não** geram MRR. O valor da linha `vlTotalItem` já é total; não multiplicar novamente pela quantidade.
4. Cada linha é uma **venda**. Reimportações devem ser idempotentes e não gerar novo evento nem nova comissão. O identificador `id` do CSV de mercadorias pode se repetir em itens diferentes: nunca deduplicar somente por esse ID. Se não for possível distinguir ocorrências idênticas legítimas, separar para conferência.
5. Desprezar horas, usar data civil ou competência mensal. Evitar deslocamento de um dia por conversão automática de fuso.
6. Não contabilizar registros sem grupo. Para grupos válidos, vendedor ainda não conciliado fica **pendente**, nunca atribuído a outra pessoa por semelhança fraca.
7. Preservar origem, linha, identificador de venda, lote, competência, importador, regras aplicadas, decisões sobre duplicidades e auditoria.
8. Novos produtos dos arquivos podem ser **pré-cadastrados** sem duplicatas, classificados por origem e indicador de MRR. Comissões só são apuradas após aprovação da regra do produto. A mesma descrição pode ter modalidades distintas: não mesclar cegamente.

## Identidade e Pré-atendimento
9. Pré-atendimento é equipe **funcional distinta do Suporte**, mas as vendas do seu pessoal com grupo C pertencem financeiramente ao **Squad C**. Não atribuir suporte técnico a esses usuários, nem gerar produtividade, FCR ou bonificação operacional fictícios.
10. Usuário ativo de Pré-atendimento tem login próprio e ID de `profiles`, vinculado explicitamente a `strategy_people.user_id` na mesma organização; vinculação histórica não deve depender apenas de nome. Os técnicos existentes preservam seu vínculo e métricas operacionais.
11. Criar módulo próprio de **Meu Pré-atendimento**. Nesta versão só a fundação/identidade; indicadores operacionais da equipe virão em fase futura. Sem acesso a dados salariais, bonificações alheias e métricas do Suporte por padrão.

## Comissões comerciais e custos
12. Regra é determinada por **produto e modalidade MRR/não MRR**, com quatro opções: **100% da venda**, **percentual da venda**, **venda menos custo de terceiros** e **valor fixo** por unidade/venda configurada. Sem custo obrigatório ou regra, deixar pendente; não presumir comissão zero ou 100%.
13. Comissão comercial nasce **uma única vez por venda**, inclusive no MRR; mensalidade recorrente não recria comissão nos meses seguintes. Reimportação não remunera novamente.
14. Salvar valores brutos da venda e comissão separadamente; integrar a comissão apurada ao campo **Comissão de vendas** da Bonificação, sem alterar automaticamente regras de teto/redução do modelo operacional.
15. Pré-atendimento terá apuração de comissão sem depender de atendimentos técnicos. A comissão mensal deve possuir memória de cálculo, auditoria e regra versionada, preservando competências fechadas.
16. Gestão Estratégica busca a **bonificação oficial** do módulo de Bonificação; salários, encargos, benefícios, extras e custos sem fonte podem ser informados manualmente. Não contabilizar comissão ou bonificação duas vezes nos custos pessoais.

## Cancelamentos e fechamento estratégico
17. Reutilizar **clientes no início do mês** e **cancelamentos por Squad** cadastrados na Bonificação; não exigir preenchimento repetido. Squad C aceita complemento manual quando pertinente. Quantidade de cancelamento não é automaticamente Receita Protegida.
18. Receita Direta, Influenciada e Protegida seguem separadas; receitas influenciada e protegida podem ser lançadas manualmente. MRR/ARR contratado não significa caixa recebido.
19. Em simulações e indicadores de ROI manter a definição oficial da Fase 5: **(receita direta − custo total)/custo total**. Influenciada/protegida não são somadas ao ROI. Custo zero ou fonte ausente => ROI indisponível, não zero fictício.
20. Fechamento da Gestão Estratégica deve conciliar custos, resultados, receita, comissões, Squad C, cancelamentos, capacidade/FTE e Produto/Squad por competência, técnico e equipe; preservar snapshots oficiais e revisões. Correção retroativa somente por fluxo autorizado e auditável.
21. Nenhum CSV, simulação ou importador pode alterar dados oficiais de competência fechada sem reabertura/ajuste expressamente autorizado. Isolar dados por organização e autorização RLS em todas as novas tabelas e RPCs.

## Entrega por versão
22. Desenvolver uma versão por vez, **ZIP incremental somente com arquivos modificados**, patch aplicável à versão anterior, migrations SQL quando houver, documentação, testes (`npm run check`), verificação de ZIP/patch e **mensagem de commit pronta**.
23. V2.63.0 entrega apenas a **fundação**: fontes CSV/manual, estrutura de lotes, login/identidade Pré-atendimento, conciliação explícita, permissões e tela inicial. **Não importa CSV, não calcula receita nem comissão**. V2.63.1+ implementam mapeamento, importação e regras comerciais.
