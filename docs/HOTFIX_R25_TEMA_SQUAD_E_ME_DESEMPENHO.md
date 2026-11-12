# Hotfix R25 — Tema correto na troca de Squad + imagem no card Meu desempenho

Base: R23 do projeto completo fornecido pelo usuário, acrescido do hotfix anterior de pré-visualização da faixa. Não inclui a R24 de bonificação, desconsiderada pelo usuário.

## Mudanças

- `selectSquad()` consulta o tema no Supabase com `force:true` ao alternar entre Squads, antes de aplicar a identidade visual. Revalida a sequência de seleção para impedir que uma resposta atrasada substitua o Squad atual. Em caso de erro de rede, conserva o último tema disponível em memória.
- O primeiro card da tela `Meu desempenho` inclui `img.individual-hero-art`, que é atualizado em `applyCampaignIdentity()` a partir de `theme.background`. Gradiente escuro garante legibilidade sem mexer nos conteúdos, ranking ou indicadores.
- Cache-buster unificado para `2.63.9-r25` para que o navegador obtenha os assets atualizados. Os testes de cache-buster foram atualizados.
- Mantida a correção anterior da faixa de pré-visualização do tema.

## Aplicação

1. Não executar SQL. Não há migration.
2. Copiar os arquivos do ZIP para as mesmas pastas do repositório, substituindo apenas arquivos de mesmo caminho. Não excluir outros arquivos do projeto.
3. Publicar no GitHub Pages e atualizar com Ctrl+Shift+R uma vez.
4. Testar troca E → A → E sem recarregar: a aparência deve ser a configuração persistida de cada Squad.
5. Testar Meu desempenho e conferir imagem de fundo no primeiro card.
6. Testar tema sem `background`: o card mantém o fundo padrão sem imagem.

## Observação

A revalidação remota depende de conexão com Supabase. Se ela falhar, o sistema registra aviso no Console e mantém a versão em cache como fallback. A aplicação no ambiente publicado ainda precisa ser homologada pelo usuário.

## Testes

`npm run check`: 1.140 testes aprovados, zero falhas.
