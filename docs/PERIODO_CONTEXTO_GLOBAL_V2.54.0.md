# V2.54.0 — Seleção avançada de período e contexto global

## Objetivo

Reduzir o número de cliques no **Intervalo livre** e manter o mesmo contexto de análise durante a navegação normal do Performance Hub.

## Intervalo livre

O modo **Por competência** permanece inalterado. No modo **Intervalo livre** foram adicionados:

- Competência inicial e competência final;
- presets de 3, 6 e 12 meses;
- Ano atual, Ano anterior e Histórico;
- seleção direta de mês e ano no cabeçalho do calendário.

Ao escolher uma competência inicial, o sistema usa a primeira data disponível daquela competência. Ao escolher a competência final, usa a última data disponível. O calendário continua disponível para ajustes finos do dia.

Os presets sempre respeitam os limites efetivamente importados. Assim, a competência atual termina na última data disponível e não projeta dias futuros.

## Contexto global

Durante a navegação comum, **Squad**, **Data inicial** e **Data final** permanecem em memória global. Entrar em outro módulo não reaplica filtros antigos daquela tela.

A prioridade é:

1. Visão salva ou URL com filtros explícitos;
2. alteração manual de Squad/Período;
3. contexto global atual;
4. filtros locais de Mês/Técnico quando aplicáveis.

Módulos que não consomem período apenas ocultam o controle; eles não redefinem o intervalo global. Mês e Técnico continuam contextuais porque não são universais a todas as telas.

## Troca de Squad

A troca manual de Squad tenta preservar o período atual. Se não houver qualquer interseção entre o período selecionado e os dados disponíveis do novo Squad, o dashboard volta para o recorte padrão mais recente desse escopo.

## Compatibilidade

- `analysisStartDate` e `analysisEndDate` continuam sendo a fonte oficial dos cálculos;
- URLs antigas continuam válidas;
- Visões salvas continuam aplicando seus filtros de forma explícita;
- nenhuma regra de meta, bonificação, pontuação ou agregação foi alterada;
- não há migration de banco.
