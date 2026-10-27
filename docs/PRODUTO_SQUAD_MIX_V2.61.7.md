# V2.61.7 — Mix, concentração e dependência

Os dados são lidos dos resumos de Unit Economics da V2.61.4 por Squad, compartilhados com a matriz V2.61.6. Não há migrations novas.

- Métricas: atendimentos, custo, receita direta, influenciada e protegida; as receitas NÃO são somadas entre si.
- Percentuais incluem **Não classificado** no denominador.
- HHI = soma dos quadrados das participações; top-1 e top-3 incluem Não classificado.
- Dependência por Squad: maior participação entre produtos classificados no mix total do Squad.
- Alerta de concentração: >=50% em um produto ou Squad, ou >=10% não classificado. São heurísticas de concentração, não provas de risco ou desempenho.
- Fontes indisponíveis ou não reconciliadas são excluídas com alerta de parcialidade.
- Fonte visual exige permissão para agregados estratégicos.
- Para validar: `npm run check`.
