# V2.58.0 — Fundação da Eficiência

## Objetivo
Abrir a Fase 3 do roadmap sem alterar o motor operacional nem antecipar as fórmulas das próximas versões. A versão cria a camada de eficiência, conecta os filtros estratégicos existentes e valida a disponibilidade das bases que alimentarão custo por atendimento, custo por resolução e produtividade econômica.

## Estrutura
- nova seção `Eficiência` dentro da Gestão Estratégica;
- rota `?page=strategy&section=efficiency`;
- novo motor puro `js/strategy-efficiency.js`;
- regra da fundação `EF-0.1.0-foundation`;
- reaproveitamento dos filtros estratégicos de competência, Squad e comparação;
- nenhuma herança dos filtros operacionais globais.

## Indicadores-base
A V2.58.0 expõe somente as entradas consolidadas necessárias para a Fase 3:
- custo consolidado;
- atendimentos válidos;
- FTE atribuído;
- cobertura da base (financeiro, produção, FTE e qualidade).

Os cálculos finais permanecem versionados no roadmap:
- V2.58.1 — custo por atendimento;
- V2.58.2 — custo por resolução;
- V2.58.3 — produtividade econômica por técnico;
- V2.58.4 — produtividade econômica por Squad.

## Contrato de dados
A fundação trata `resolutions` como fonte ainda indisponível. Isso é intencional: a V2.58.0 não inventa uma definição de resolução nem reaproveita atendimento como substituto. O indicador de custo por resolução permanece `pending` até a fonte e a regra serem formalizadas.

## Segurança e isolamento
- os valores financeiros continuam protegidos por `can_view_aggregates`;
- a nova seção não cria acesso a custos individuais;
- não há nova migration;
- nenhum cálculo de bonificação, ranking, qualidade ou importação operacional é alterado;
- a fundação usa somente dados já disponíveis nas camadas estratégica e operacional.

## Critério de aceite
1. A rota `strategy/efficiency` abre sem filtros operacionais globais.
2. Competência, Squad e comparação alteram o mesmo estado estratégico já existente.
3. Sem permissão agregada, o custo consolidado permanece protegido.
4. Sem atendimentos/FTE/qualidade, a tela sinaliza base parcial sem fabricar valores.
5. Custo por resolução permanece pendente até a V2.58.2.
6. `npm run check` deve concluir sem falhas.
