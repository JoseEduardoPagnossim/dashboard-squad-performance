# V2.55.0 — Preparação inteligente de CSV

## Objetivo

Permitir que as importações **Produto/Empresa** e **Qualidade Completa** usem o mesmo relatório bruto exportado do CRM, sem exigir edição manual em Excel antes do upload.

## Novo fluxo

Depois de escolher o CSV, a Central de Importação abre a etapa **Preparar relatório**. Nela o administrador pode mapear quais colunas da origem correspondem a:

- Data;
- Técnico;
- Nota Serviço (Qualidade Completa);
- Nota Produto;
- Nota Empresa;
- Grupo/Squad, opcional na Qualidade Completa.

Colunas não utilizadas são ignoradas automaticamente e nunca são persistidas somente por existirem no relatório original.

## Deduplicação

Para **Produto/Empresa**, a deduplicação vem ligada por padrão. O administrador escolhe uma ou mais colunas de identificação, por exemplo CNPJ, código do cliente ou razão social.

A chave é aplicada **dentro de cada competência**. Assim, o mesmo cliente pode ser considerado novamente em outro mês, mas ocorrências repetidas dentro da mesma competência são tratadas conforme a estratégia escolhida:

- manter a primeira ocorrência; ou
- manter a última ocorrência.

Linhas sem valor nas chaves de deduplicação são preservadas para evitar exclusão acidental.

Para **Qualidade Completa**, a deduplicação fica desativada e bloqueada por padrão, preservando a regra da V2.53.0 de considerar todas as respostas do relatório.

## Compatibilidade

O arquivo preparado é convertido internamente para os mesmos cabeçalhos canônicos já consumidos pelos parsers anteriores. Por isso:

- nenhuma migration é necessária;
- não há alteração no schema;
- as regras de vínculo de técnico/Squad continuam as mesmas;
- a persistência de Produto/Empresa e Qualidade Completa continua usando as mesmas tabelas e cálculos;
- o checksum/histórico continua referenciando o arquivo original escolhido pelo usuário.

## Preferências

O mapeamento e as chaves de deduplicação são lembrados localmente para o mesmo conjunto de cabeçalhos e tipo de importação, reduzindo o trabalho nas próximas cargas do mesmo relatório.
