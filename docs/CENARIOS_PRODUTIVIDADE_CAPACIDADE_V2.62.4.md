# V2.62.4 — Simulação de produtividade e capacidade

O painel cruza demanda projetada e equipe projetada usando referência histórica de atendimentos por FTE da Fase 4. Só calcula quando a fonte histórica e a capacidade disponível estiverem completas. Não grava dados no Supabase.

FTE necessário = demanda projetada / produtividade histórica por FTE. Utilização = FTE necessário / FTE projetado. Gap = FTE projetado - FTE necessário. Ociosidade e sobrecarga são partes positivas do gap e do seu inverso.

A produtividade histórica é hipótese de capacidade, não garantia.
