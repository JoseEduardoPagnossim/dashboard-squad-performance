# R30.4 — Aplicação incremental

Base necessária: R30.3 publicada, com migration de aparência institucional R30.2 aplicada.

## Alterações
- Ranking Completo: status oficial da competência separado do status de período simulado.
- Meu Desempenho: distribuição agregada de notas 1, 2, 3 do próprio técnico e total mensal; detalhe diário quando disponível.
- Login: imagem institucional com visibilidade ampliada e aviso de falha de carregamento.
- Guia Como usar: três tutoriais adicionados.
- Nenhuma mudança na bonificação, nos cálculos, no Supabase ou em competências fechadas.

## Instalação
1. Faça backup da pasta do projeto.
2. Copie o conteúdo de `dashboard-squad-performance/` para a raiz correspondente do repositório, substituindo apenas os arquivos fornecidos; preserve `.git`.
3. Execute `npm run check` e confirme 1.187 testes sem falhas.
4. Envie ao GitHub; confira Actions. Atualize navegador com Ctrl+Shift+R.
5. Confira Ranking Completo, Meu Desempenho e o login em janela anônima.

Se a imagem ainda não aparecer, confira se a imagem comum foi salva e se a RPC pública `get_public_global_background` retorna uma imagem; imagem de Squad nunca deve ser usada como fallback.

Commit: `feat: distingue status oficial e recorte e exibe notas baixas individuais (R30.4)`
