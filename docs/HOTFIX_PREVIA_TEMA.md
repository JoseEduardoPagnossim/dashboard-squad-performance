# Hotfix: imagem de fundo na faixa de pré-visualização do tema

Base: pacote completo enviado pelo usuário, R23. Não aplicar a R24 de bonificação.

## Problema
A faixa `.theme-preview` utilizava `--hero-img` como fundo CSS e a imagem calculada no navegador não correspondia ao campo `background` salvo do tema. A barra lateral e a inicialização já exibiam a imagem correta.

## Correção
A faixa agora recebe `<img class="theme-preview-art">` cujo `src` é o `safeBg` obtido do `theme.background` em `applyCampaignIdentity`. A imagem é removida quando não há fundo; uma sobreposição linear mantém os textos legíveis. O componente não depende mais de `--hero-img` como sua imagem principal.

Arquivos: `index.html`, `js/app.js`, `css/styles.css`, teste específico.

Sem migration; sem alteração de dados ou de comportamento dos demais módulos.

## Aplicação
Publicar os arquivos do ZIP preservando as pastas, sobre a R23, e atualizar o site com Ctrl+F5. Abrir Configurações > Aparência e gráficos > Tema e conferir a faixa Black November Squad E e a imagem na lateral. Caso o navegador mantenha cache, aguardar a propagação do GitHub Pages e recarregar forçando atualização.

## Verificação local
`npm run check` (validação + testes). O resultado visual deve ser homologado no navegador do usuário.

Commit: `fix: usa imagem salva do tema na faixa de pre-visualizacao`
