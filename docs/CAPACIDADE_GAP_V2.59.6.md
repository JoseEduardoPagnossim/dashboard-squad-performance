# V2.59.6 — Gap de capacidade

A V2.59.6 transforma o dimensionamento da V2.59.5 em um saldo operacional explícito de força e capacidade.

## Regra principal

`Gap de FTE = FTE disponível − FTE necessário`

- resultado positivo: excesso de capacidade em FTE;
- resultado negativo: déficit de capacidade em FTE;
- resultado zero: estrutura disponível igual à necessidade estimada.

O sinal é calculado com o valor real do motor. O arredondamento exibido na interface não decide a classificação.

## Gap em atendimentos

A mesma referência histórica de atendimentos por FTE disponível usada na V2.59.5 converte o saldo de força em volume:

`Capacidade disponível em atendimentos = FTE disponível × referência histórica de atendimentos/FTE`

`Gap de capacidade em atendimentos = capacidade disponível em atendimentos − demanda atual`

Exemplo: 4 FTE disponíveis, 5 FTE necessários e referência de 300 atendimentos/FTE resultam em `-1,00 FTE` e `-300 atendimentos` de gap.

## Operação e Squad

A operação consolidada usa o histórico agregado da operação. Cada Squad usa sua própria sequência histórica fechada e completa, preservando a mesma janela selecionada no filtro estratégico.

O filtro de Squad limita a visualização, mas não mistura a referência histórica de grupos diferentes.

## Fail-closed

O gap não é calculado quando falta qualquer uma das bases necessárias:

- FTE disponível da competência;
- atendimentos atuais;
- referência histórica válida de atendimentos por FTE disponível;
- FTE necessário calculável.

A V2.59.6 não cria estimativas retroativas para competências sem disponibilidade.

## Interpretação

Déficit de FTE não é uma recomendação automática de contratação. Ele informa que, pela referência histórica selecionada, a demanda atual exige mais força equivalente do que a disponível.

Excesso também não significa automaticamente ociosidade inadequada. Pode refletir sazonalidade, reserva operacional, mudança de demanda ou melhoria de produtividade. A investigação das causas e recomendações fica para a V2.59.7 — Insights e diagnóstico de capacidade.

## Banco de dados

A V2.59.6 não possui migration nova. Ela reutiliza as bases e RPCs instaladas até `MIGRACAO_V2.59.5.sql`.
