# V2.60.3 — Receita Protegida

## Objetivo
Medir receita existente preservada pela atuação de Suporte/Onboarding em retenção, recuperação ou prevenção de cancelamento, sem tratar esse valor como nova venda.

## Regra econômica
- evento `protected` em `draft`: caso em acompanhamento; representa receita em risco e não entra como protegida;
- evento `protected` em `confirmed`: permanência/recuperação validada; entra em Receita Protegida;
- evento `protected` em `cancelled`: perda confirmada ou retenção sem sucesso; permanece auditável e não compõe Receita Protegida;
- um confirmado precisa ter `protection_verified_at` e ao menos um valor econômico em receita do período, MRR ou ARR;
- se um caso confirmado for perdido antes do fechamento, ele deve ser marcado como perdido para sair dos indicadores sem apagar o histórico do caso.

## Naturezas nativas
- `retention` — retenção após intenção ou pedido de cancelamento;
- `recovery` — recuperação de cliente/receita em risco ou interrompida;
- `cancellation_prevention` — prevenção de cancelamento antes da formalização da saída.

## Indicadores
- Receita Protegida no período (`gross_amount` confirmado e validado);
- MRR protegido;
- ARR protegido;
- MRR/ARR em risco para casos em acompanhamento;
- casos acompanhados;
- proteções confirmadas;
- perdas;
- taxa de proteção sobre casos encerrados;
- composição por natureza.

## Integridade
Receita Protegida não é somada automaticamente à Receita Direta nem à Receita Influenciada. MRR e ARR são indicadores paralelos e não são adicionados novamente ao total do período. A mesma `source_reference` continua única no domínio econômico, evitando registrar o mesmo caso como duas naturezas diferentes.

## Auditoria
A atribuição usa o papel `retainer`. Alterações de acompanhamento para proteção confirmada ou perda são registradas sem apagar o evento econômico. O filtro de Squad usa `EXISTS` nas atribuições para não multiplicar o valor quando houver mais de um participante.
