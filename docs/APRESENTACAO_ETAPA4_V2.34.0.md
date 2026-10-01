# Apresentação — Etapa 4: Administração (V2.34.0)

A V2.34.0 adiciona uma área administrativa dentro do módulo **Apresentação** para configurar a experiência da televisão sem editar código.

## Preferências disponíveis

- Squad da TV: Todos os Squads, A, B, D ou E.
- Intervalo do carrossel: 10, 15, 20, 30, 45 ou 60 segundos.
- Atualização automática: 1, 2, 5, 10 ou 15 minutos.
- Layout do ranking: automático, 1 coluna ou 2 colunas.
- Carrossel automático ligado/desligado.
- Indicadores superiores visíveis/ocultos.
- G6/Z4 visíveis/ocultos.
- Busca e filtro de grupo visíveis/ocultos na TV.
- Seleção das seis abas que participam da apresentação.
- Ordem das abas usando os botões de subir/descer.

## Persistência e URL

As preferências são salvas no `localStorage` do navegador administrativo e a URL gerada carrega todos os parâmetros necessários. Assim, a TV pode usar uma URL autocontida sem depender das preferências salvas no computador do administrador.

Exemplo de estrutura:

`?view=presentation&squad=all&interval=20&refresh=5&columns=auto&carousel=1&kpis=1&spots=1&filters=0&tabs=day,notesDay,general,notesGeneral,group,notesGroup&start=day`

A URL pode ser copiada ou aberta diretamente pela própria tela de configuração.

## Compatibilidade

URLs antigas como `?view=presentation&squad=all` continuam válidas e usam as preferências locais/padrão quando não existem parâmetros adicionais.
