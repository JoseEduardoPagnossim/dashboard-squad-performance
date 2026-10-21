# V2.56.2 — Filtro de Squad reativo na Qualidade

## Problema confirmado

A V2.56.1 ainda podia manter os números do Squad anterior visíveis ao trocar o filtro diretamente na aba **Qualidade**.

A causa estava no fluxo assíncrono: a troca do estado do Squad ocorria, porém a renderização final da tela aguardava o carregamento completo das competências do novo escopo. Em ambientes com Supabase, isso fazia a interface permanecer temporariamente com os dados anteriores e dava a impressão de que o filtro não havia sido aplicado. Passar antes por **Desempenho** mascarava o problema porque essa aba já iniciava a hidratação dos dados do novo Squad.

## Correção

A troca de Squad agora segue esta ordem:

1. atualiza imediatamente o contexto global do Squad;
2. atualiza o seletor, cabeçalho e a tela ativa sem esperar a rede;
3. se a Qualidade ainda não possuir os meses completos do novo escopo, remove os números anteriores e mostra **Atualizando dados do Squad...**;
4. reutiliza em segundo plano o mesmo carregador de dados usado pela aba **Desempenho**;
5. renderiza novamente somente se o usuário continuar no mesmo Squad, mesma aba e mesmo período.

## Proteções contra corrida assíncrona

Cada hidratação recebe uma sequência e uma chave formada por:

- subaba de Indicadores;
- Squad;
- data inicial;
- data final.

Uma resposta antiga não pode mais redesenhar a tela depois que o usuário mudou de Squad, período ou subaba.

A Qualidade deixa de manter um caminho próprio de hidratação para a troca de Squad e passa a usar o mesmo fluxo de carregamento da aba **Desempenho**. Isso remove a diferença de comportamento que fazia o filtro funcionar depois de visitar Desempenho, mas não diretamente em Qualidade. Em caso de falha, a tela limpa o estado de atualização e sinaliza o erro sem reutilizar os números do Squad anterior.

## Escopo preservado

- Nenhuma fórmula de Qualidade foi alterada.
- Nenhuma regra de Desempenho ou Gestão Preditiva foi alterada.
- Nenhuma regra de bonificação ou importação foi alterada.
- Sem migration e sem alteração de schema.
