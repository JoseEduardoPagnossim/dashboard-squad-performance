# Ajuste automático de TV - V2.34.4

A apresentação direta agora trabalha sobre uma área virtual 16:9 de 1920x1080 e calcula a escala necessária para caber na viewport real da televisão.

## Configurações

- **Ajuste à tela:** Automático, Largura, Altura, Preencher ou Sem ajuste.
- **Escala:** Automática ou 75% a 110%. Quando há encaixe ativo, a escala manual funciona como multiplicador do valor calculado.
- **Densidade:** Automática, Compacta, Normal ou Ampla.
- **Margem de segurança:** 0, 8, 16, 24 ou 32 px para compensar overscan/bordas da TV.

## Comportamento

No modo Automático, é usado o menor fator entre largura disponível e altura necessária, impedindo barras de rolagem. O cálculo é repetido ao mudar a resolução, entrar/sair de fullscreen ou quando o conteúdo da apresentação muda. A densidade automática prioriza legibilidade e reduz espaçamentos quando há muitas linhas ou pouca altura disponível.
