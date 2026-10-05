# V2.44.0 — Design System e padronização visual

A V2.44.0 consolida a linguagem visual do Soften Performance Hub sem alterar regras de negócio. A camada foi criada para reduzir diferenças acumuladas entre módulos que surgiram em versões diferentes e facilitar a evolução futura do produto.

## Objetivos

- padronizar espaçamento, tipografia, raios, bordas e sombras;
- estabelecer três famílias visuais de cards: KPI, análise e configuração;
- unificar botões, campos, estados de foco, hover e disabled;
- tornar tabelas mais legíveis em grandes volumes de dados;
- reaproveitar os temas atuais e suas cores, sem fixar uma paleta paralela;
- respeitar a densidade confortável/compacta já salva por usuário;
- manter a apresentação/TV independente da camada principal.

## Arquivos centrais

- `css/design-system.css`: tokens e regras visuais V2.44;
- `js/design-system.js`: decoração semântica leve de cards e tabelas;
- `css/styles.css`: continua contendo estilos históricos e específicos de cada módulo;
- `css/presentation.css`: continua sendo a camada própria do modo Apresentação/TV.

A ordem no `index.html` é intencional:

1. `css/styles.css`
2. `css/design-system.css`
3. `css/presentation.css`

Assim o Design System padroniza a aplicação, enquanto a apresentação mantém seus ajustes específicos.

## Cards

O sistema diferencia visualmente:

- **KPI:** números e situação principal, com menos conteúdo e leitura rápida;
- **Análise:** gráficos, rankings, históricos e comparações;
- **Configuração:** parâmetros administrativos e formulários;
- **Informativo:** observações e explicações sem aparência de elemento clicável.

O antigo efeito de hover genérico em todos os cards foi reduzido. Elevação visual fica reservada para elementos realmente interativos.

## Tabelas

As tabelas passam a compartilhar:

- cabeçalho fixo;
- altura e padding consistentes;
- números tabulares para facilitar comparação vertical;
- linhas alternadas discretas;
- hover mais claro;
- primeira coluna fixa automaticamente em tabelas largas;
- densidade automática para tabelas com muitas colunas;
- controles internos menores em células;
- contêiner focável apenas quando há rolagem horizontal relevante.

`js/design-system.js` classifica tabelas pela quantidade de colunas. A classificação é reaplicada somente quando uma nova tabela é inserida dinamicamente, usando `MutationObserver` e `requestAnimationFrame`, evitando observação pesada de conteúdo comum.

## Controles

Alturas-base:

- controle normal: 42 px;
- controle compacto: 34 px;
- login/destaque: 46 px quando aplicável.

Todos os controles compartilham estados de foco visíveis, disabled e geometria coerente.

## Densidade por usuário

A preferência já existente (`comfortable` / `compact`) passa a influenciar também cards e tabelas. Não foi criada nova coluna ou migration.

## Compatibilidade

- não altera Supabase;
- não altera cálculos;
- não altera permissões;
- não altera lazy loading/cache da V2.43;
- não altera o motor de gráficos;
- não altera o modo TV.

## Regra para novas telas

Novas funcionalidades devem preferir os tokens `--ds-*` e os componentes existentes em vez de criar novos tamanhos, bordas e sombras locais. Estilos específicos continuam permitidos quando representam uma necessidade funcional do módulo.

## Qualidade

A versão foi validada com **129/129 testes automatizados aprovados**, incluindo testes específicos de ordem de carregamento, tokens, cards, tabelas, responsividade e ausência de acesso a rede/banco pela camada visual.
