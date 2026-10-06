# V2.48.5 — Controles estáveis e revisão de regressão

## Problema corrigido

A V2.48.4 substituiu visualmente todos os `select` por um componente próprio do Design System, mas fazia isso movendo o elemento `<select>` original para dentro de um wrapper novo e instalando hooks globais nos setters de `HTMLSelectElement`.

Essa abordagem era visualmente consistente, porém agressiva demais para uma aplicação que já possui dezenas de filtros dependentes e campos reconstruídos dinamicamente. Em determinados fluxos, Squad, competência, técnico, grupos e outros selects podiam deixar de acompanhar corretamente a lógica existente.

## Nova estratégia dos selects

O componente visual continua sendo próprio do Performance Hub, mas a implementação agora segue estas regras:

- o `<select>` original **não é reparentado**;
- o select continua no mesmo pai e na mesma posição lógica esperada pelo código existente;
- o elemento nativo fica oculto visualmente e continua sendo a fonte de verdade;
- o proxy visual é inserido como **irmão** do select;
- o menu de opções é renderizado em portal fixo no `body`, evitando cortes por `overflow` de topbar, cards, tabelas e modais;
- `input` e `change` são disparados no select original, preservando todos os listeners já existentes;
- não há mais alteração de `HTMLSelectElement.prototype`;
- opções adicionadas por `innerHTML`, estados `disabled` e valores alterados por JavaScript são sincronizados automaticamente;
- selects adicionados e removidos dinamicamente têm criação e limpeza automáticas.

## Sidebar

Preferências antigas anteriores à versão 5 das preferências de UI recebem uma recuperação única:

- grupos e subgrupos voltam ao estado expandido padrão;
- o estado de sidebar inteira recolhida é preservado;
- após a migração, novas escolhas de expandir/recolher continuam sendo persistidas normalmente.

Isso corrige estados de navegação que tenham ficado recolhidos durante a transição da V2.48.4 sem remover a funcionalidade de navegação retrátil.

## Auditoria dos controles

A base atual contém 159 controles estáticos no HTML, além de campos criados dinamicamente. Permanecem cobertos pelo Design System:

- texto, e-mail e senha;
- busca;
- número sem spinner nativo;
- select customizado;
- textarea;
- data, mês e data/hora com acionador visual próprio;
- checkbox e radio;
- range;
- color;
- uploads ocultos e acionados por botões da aplicação.

## Banco de dados

Não exige migration SQL.
