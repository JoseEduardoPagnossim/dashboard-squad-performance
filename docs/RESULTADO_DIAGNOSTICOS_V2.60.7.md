# V2.60.7 — Insights e diagnóstico de resultado

## Objetivo

Traduzir os indicadores econômicos da Fase 5 em situações operacionais explicáveis, sem transformar correlação em causalidade nem criar decisões automáticas.

Motor: `RE-0.8.0-result-diagnostics`.

## Fontes usadas

A V2.60.7 não cria uma nova fonte financeira. O diagnóstico reutiliza a base oficial da V2.60.6:

- Receita Direta confirmada;
- Receita Influenciada confirmada;
- Receita Protegida confirmada;
- custo total da operação/Squad;
- custo pessoal do técnico;
- ROI direto;
- cobertura direta de custo;
- impacto influenciado por R$ de custo;
- impacto protegido por R$ de custo.

Não há migration nova nesta versão.

## Guardrail econômico

O ROI continua sendo calculado somente sobre Receita Direta. Receita Influenciada e Protegida entram apenas como contexto econômico independente e nunca são somadas à Receita Direta para criar um ROI composto.

## Situações diagnósticas

### Retorno direto forte

Cobertura direta igual ou superior a 1,25x. Indica que a Receita Direta cobre o custo com folga. A próxima análise é recorrência, concentração e repetibilidade.

### Retorno direto positivo

Cobertura entre 1,00x e 1,25x. A Receita Direta cobre o custo sem depender de Receita Influenciada ou Protegida.

### Próximo do break-even direto

Cobertura entre 0,85x e 1,00x. O painel sinaliza atenção porque pequenas variações de custo ou conversão podem alterar a leitura.

### Influência alta, retorno direto baixo

Cobertura abaixo de 0,85x com impacto influenciado material (>= 1,00 por R$ de custo) e valor influenciado maior que o direto. O diagnóstico orienta investigar handoff, fechamento e janela de reconhecimento. Ele não afirma falha comercial.

### Impacto concentrado em proteção

Cobertura abaixo de 0,85x com impacto protegido material (>= 1,00 por R$ de custo) e Receita Protegida superior à Direta. O painel reconhece que a operação pode estar exercendo papel econômico de retenção e orienta validar MRR preservado, risco de churn e custo de proteção.

### Retorno direto abaixo do custo

Cobertura abaixo de 0,85x sem um sinal dominante de influência ou proteção. A orientação é revisar mix de atividades, cobertura dos registros e custo antes de definir ação gerencial.

### Custo sem resultado econômico atribuído

Existe custo, mas não há Receita Direta, Influenciada ou Protegida atribuída. Isso não prova ausência de valor: pode ser lacuna de registro ou atuação sem evento econômico mensurado.

### Base econômica incompleta

Sem custo válido, ROI e razões por custo não são interpretados. O diagnóstico fecha como lacuna de dados.

## Níveis de leitura

- Operação: custo total do escopo.
- Squad: custo total do Squad e resultado econômico rateado antes do filtro.
- Técnico: custo pessoal e contribuição econômica individual. Exige permissão `people_costs`.

## Princípio de interpretação

O painel explica combinações observadas. Antes de agir, a gestão deve validar recorrência, cobertura de lançamentos, janela de reconhecimento, carga de retenção, handoff comercial, complexidade e contexto operacional. Um diagnóstico nunca é ordem automática de contratar, reduzir equipe, cobrar ou alterar meta.
