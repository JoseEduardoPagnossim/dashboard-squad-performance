# R16 — Estorno de lotes e filtro de competência

- Migrar após R15. A nova migration substitui somente a prévia de elegibilidade, mantendo a RPC transacional de estorno R15.
- Fechamentos operacionais **anteriores** ao lote importado não bloqueiam seu estorno; os realizados após a importação continuam bloqueados. Fechamentos estratégicos e snapshots financeiros nunca são dispensados.
- Comissões técnicas persistidas ou atualizadas **após a importação** seguem protegidas; o SQL exige revisão, não remove snapshots nem reabre meses.
- O filtro visual da importação permite **todas as competências** ou **uma competência**; a filtragem ocorre antes de montar as vendas MRR e avulsas, sem modificar o CSV original. Datas inválidas ficam fora do filtro mensal e não são importadas.
- A seleção de todo o histórico no futuro não reabre meses operacionais e continua sujeita às proteções de fechamento estratégico/duplicidade existentes no importador.
- **Atenção:** migrar e testar em ambiente de homologação primeiro, incluindo prévia e reversão de lote com 2025–2026, e conferir valores das comissões antes de usar produção. Nenhum dado real foi modificado neste pacote.
