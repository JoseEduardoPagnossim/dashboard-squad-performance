# V2.34.8 — Gráficos, aparência multi-Squad e regra de férias

## Gráficos
Todos os renderizadores SVG do projeto passaram a consumir as preferências visuais centrais para rótulos, fonte, altura, linha e pontos. Os gráficos de qualidade continuam com limite responsivo de segurança em telas pequenas, mas não usam mais uma altura fixa que ignore a configuração administrativa.

As preferências de gráficos agora fazem parte do `themePayload`, portanto são exportadas no JSON e persistidas em `squad_themes` no Supabase.

## Aparência
O Admin Geral pode escolher o escopo da aparência: somente o Squad selecionado ou todos os Squads. No escopo global, tema, identidade e preferências visuais são replicados para A, B, D e E. Admins de Squad continuam limitados ao próprio Squad.

## Férias na bonificação
Regra anterior: 50% sobre o subtotal final.

Regra V2.34.8: 50% somente sobre a comissão-base já multiplicada pelo cancelamento. Bônus manual, prêmios, comissão de vendas, desconto e redistribuição não sofrem o redutor de férias.

Fórmula resumida:

`base_ferias = base_apos_cancelamento * 0,5` (quando férias)

`subtotal = base_ferias + bonus + premios + vendas - desconto + redistribuicao`

No modelo Individual, o piso zero e o teto global continuam sendo aplicados após essa composição.
