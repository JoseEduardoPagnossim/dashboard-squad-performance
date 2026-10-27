# V2.62.5 — Simulação de resultados econômicos

## Escopo
Simulação local por competência e Squad, utilizando os dados oficiais consolidados de custo e ROI da Fase 5. Não persiste premissas ou resultados e não modifica competências nem snapshots.

## Validação
A fonte de ROI deve estar disponível e na mesma competência/Squad. O custo total deve conciliar com custo de pessoal mais custo operacional e com o custo informado pela Fase 5 (tolerância de arredondamento de R$ 0,07). Sem fonte e reconciliação não é produzido cenário.

## Premissas
Variações percentuais separadas, entre -100% e +300%, para Receita Direta, Influenciada, Protegida, Custo Pessoal e Custo Operacional. Não existe multiplicação automática de receita ao alterar equipe, FTE ou demanda; toda variação de receita exige premissa explícita.

## Fórmulas
Custo total simulado = custo de pessoal simulado + custo operacional simulado.
Retorno líquido direto simulado = Receita Direta simulada - Custo Total simulado.
ROI direto (%) = (Receita Direta simulada - Custo Total simulado) / Custo Total simulado × 100.
Cobertura direta = Receita Direta simulada / Custo Total simulado.
Influenciada / custo e Protegida / custo são somente indicadores paralelos de impacto, e nunca são adicionados ao ROI, retorno líquido ou caixa.

Custo simulado igual a zero torna ROI e indicadores por custo indisponíveis (não zero ou infinito).

## Fonte e limitações
Os dados vêm de vm.financial.resultRoi e vm.summary na Gestão Estratégica, com permissão de indicadores agregados; nenhuma nova migration foi criada. O motor valida todos os denominadores e sinaliza eventuais receitas sem alocação completa. Valores futuros são hipóteses, não receita reconhecida.

## QA
Executar npm run check e validar a interface com dados reais, permissões financeiras, competências fechadas e abertas e divergências financeiras.
