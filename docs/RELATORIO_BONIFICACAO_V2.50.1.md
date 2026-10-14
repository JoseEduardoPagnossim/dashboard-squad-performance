# V2.50.1 — Relatório de bonificação personalizável

## Objetivo

Permitir que o Administrador monte o relatório de bonificação de acordo com a necessidade do fechamento, sem alterar regras financeiras, valores calculados ou a memória de auditoria.

## Configuração

O botão **Configurar relatório** fica junto às ações de Excel e PDF no fechamento financeiro. A configuração controla apenas a tabela de técnicos.

- marque ou desmarque colunas para definir o que será exibido;
- arraste as linhas para escolher a ordem;
- os botões de seta oferecem a mesma ordenação para teclado e dispositivos sem drag-and-drop;
- **Técnico** permanece obrigatório;
- a prévia mostra imediatamente a sequência que será usada no relatório.

## Presets

- **Enxuto:** Técnico, Status, Atendimentos, Valor oficial, Bônus total, Desconto, Redistribuição e Férias.
- **Completo:** todas as colunas disponíveis.
- **Minha configuração:** restaura a última configuração salva pelo usuário.
- **Restaurar padrão:** retorna ao conjunto de colunas usado pelo PDF antes desta versão.

## PDF

O PDF respeita integralmente seleção e ordem. Quando muitas colunas forem escolhidas, o AutoTable divide a tabela horizontalmente e repete a coluna Técnico como referência. O cabeçalho com Squad, competência, situação, modelo oficial, regra e data de geração não é removido pela personalização.

## Excel

Por padrão o Excel continua completo, preservando seu uso para auditoria e análise. A opção **Usar estas colunas também no Excel** aplica a mesma seleção e ordem da tabela do PDF à planilha de Técnicos. As abas Resumo e Administradores permanecem completas.

## Persistência

A configuração é armazenada dentro das preferências do usuário já existentes. Quando a sincronização remota de preferências estiver disponível, a escolha acompanha o perfil; caso contrário, fica salva localmente no navegador. Não é necessária migration adicional.
