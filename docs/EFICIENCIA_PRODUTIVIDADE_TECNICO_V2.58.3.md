# V2.58.3 — Produtividade econômica por técnico

## Objetivo
Relacionar resultado operacional individual com o custo pessoal estratégico sem transformar salário baixo em sinônimo de eficiência.

## Fórmula oficial
`produtividade econômica = resoluções / custo pessoal × 1.000`

A leitura representa quantas resoluções são entregues a cada R$ 1.000 de custo pessoal do técnico. O custo pessoal já respeita o FTE da competência. Custos operacionais compartilhados permanecem no nível do Squad e não são empurrados artificialmente para indivíduos.

## Contexto exibido
Cada técnico mostra também:
- FTE;
- atendimentos;
- resoluções;
- taxa de resolução;
- nota média de avaliação, quando disponível;
- custo pessoal por resolução.

A nota média é um guardrail visível e não multiplica o índice. A versão não cria pesos ocultos nem classifica automaticamente qualidade como boa/ruim.

## Elegibilidade
O ranking exige vínculo com usuário operacional, custo pessoal positivo e uma base explícita de resoluções. Linhas incompletas continuam visíveis, porém sem posição no ranking e com a pendência indicada.

## Segurança
A produtividade por técnico exige a mesma permissão que protege custos pessoais. Usuários com acesso apenas agregado não recebem linhas individuais.

## Banco
Não há migration nova na V2.58.3. A versão depende da base de resoluções criada pela `MIGRACAO_V2.58.2.sql`.

## Regra do motor
`EF-0.4.0-economic-productivity-person`
