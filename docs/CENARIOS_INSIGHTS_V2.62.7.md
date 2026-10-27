# V2.62.7 — Insights e recomendações estratégicas

## Escopo
Os insights interpretam os resultados retornados por `SoftenStrategyScenarios.compareScenarios` sem ler ou modificar o banco. Mesmo recorte de competência, Squad e revisão. As recomendações são **hipóteses de verificação**, nunca comandos automáticos ou previsão de resultados.

## Sinais e evidências
- **Sobrecarga**: `overloadFte > 0` no cenário; mostra utilização e FTE necessário. Dado ausente não vira zero.
- **Ociosidade relevante**: `idleFte / availableFte >= 20%`, apenas com FTE válido e positivo.
- **Alívio da sobrecarga**: sobrecarga inferior à base atual.
- **Resultado negativo, queda ou melhora**: comparação do `directNet` com zero e com a base atual; depende de fonte econômica conciliada.
- **Compensações**: custo cresce enquanto atendimentos não crescem; resultado direto melhora com sobrecarga; alívio da sobrecarga com queda no resultado; receita direta aumenta e retorno líquido cai.
- **Integridade**: alterações de equipe/jornada exigem premissas financeiras explícitas; receitas influenciada/protegida não integram ROI; fontes ausentes tornam apenas a respectiva dimensão indisponível.

## Cautelas
Limiar de ociosidade de 20% é **indicativo**, não meta oficial de RH. Resultado econômico e sobrecarga são **sinais condicionais** às premissas. Não há simulação automática de custos salariais decorrentes de contratação ou efeitos de demanda em receita. Cenários otimista e conservador usam hipóteses ilustrativas da V2.62.6, não previsões probabilísticas.

## QA e implantação
Acesse Gestão Estratégica → Cenários → Comparativo entre cenários. Os cartões são filtráveis por cenário e tipo. Valide sinais financeiros e de capacidade com dados reais e usuários autorizados. `npm run check` cobre testes anteriores e novos. Não há migrations nesta versão.
