# V2.38.1 — Centralização das configurações

## Objetivo
Separar **configuração** de **operação**. Uma tela operacional responde “o que está acontecendo / o que preciso executar”; a Central de Configurações responde “quais regras e comportamentos o módulo utiliza”.

## Mapeamento adotado

### Configurações > Operação e metas
- metas mensais do Squad;
- referências automáticas e fórmula de pontuação;
- competência selecionável na própria Central.

Permanecem em Operação: importações, conciliação, ajustes individuais, histórico e fechamento de competência.

### Configurações > Bonificação
- modelo oficial Base do Squad / Individual;
- comparação administrativa e comparação liberada ao técnico;
- clientes iniciais, cancelamentos e multiplicador;
- prêmios, desconto e teto;
- faixas de atendimento, Notas 5 e cancelamento.

Permanecem em Bonificação: dados individuais dos técnicos, bônus/vendas/férias por pessoa, auditoria do cálculo, relatórios e comissão manual do Admin Geral.

### Configurações > Aparência e gráficos
- tema e ambientação;
- aplicação no Squad atual ou em todos;
- importação/exportação de tema;
- fonte, rótulos, altura, padding, linha, ponto e escala dos gráficos.

### Configurações > Apresentação / TV
- Squad da TV;
- intervalo e atualização;
- layout, ajuste, escala, densidade e margem;
- KPIs, G6/Z4, busca/filtro;
- abas e ordem do carrossel;
- URL configurada da TV.

Permanecem em Apresentação: rankings, KPIs, filtros operacionais, atualizar, carrossel, URL, abrir nova tela e fullscreen.

### Configurações > Meu painel
- visibilidade e ordem dos blocos;
- densidade por usuário.

### Configurações > Usuários e permissões
- resumo de governança e permissões.

A edição individual de usuário continua em **Usuários**, pois é administração da entidade (cadastro/vínculo/perfil), não uma regra global de módulo.

## Navegação
A Central ganhou busca textual, filtros por módulo e contexto de competência. Cards centralizados recebem uma faixa `MÓDULO: ...` para reduzir ambiguidade.

## Compatibilidade
A alteração reutiliza os mesmos IDs, funções de salvamento, auditoria e persistência já existentes. Os cards são realocados no DOM antes do binding dos eventos, evitando duplicação de regras ou controles.
