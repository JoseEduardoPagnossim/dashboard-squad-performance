# V2.48.13 — Central de Importação responsiva

## Objetivo

A Central de Importação deixa de depender do filtro externo do painel e passa a controlar seu próprio escopo de importação. A dialog também recebe rolagem interna, rodapé fixo e suporte a arrastar e soltar arquivos CSV.

## Escopo

- Administrador Geral escolhe **Todos os Squads** ou um Squad específico dentro da dialog.
- O filtro de Squad da topbar não é alterado pela importação.
- A troca de escopo reaproveita o CSV já carregado e refaz vínculos, meses, prévia e validações.

## Dialog

A estrutura é dividida em cabeçalho, corpo rolável e rodapé fixo. O fundo do sistema não rola enquanto existir uma modal aberta.

## Drag-and-drop

O CSV pode ser arrastado para a Central de Importação na tela de Operação ou diretamente para a área de upload dentro da dialog. O botão tradicional **Escolher CSV** continua disponível.

## Segurança

Nenhuma regra de cálculo, persistência financeira, RLS ou schema foi alterada. A confirmação, prévia de risco, bloqueio de mês fechado, snapshot de rollback e histórico de importação continuam usando os mesmos motores.
