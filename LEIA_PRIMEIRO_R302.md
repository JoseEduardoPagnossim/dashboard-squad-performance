# Aplicacao R30.2 — imagem institucional + organizacao

**Esta entrega e baseada no ZIP mais recente fornecido em 19/11/2026.**

1. Faca backup da sua pasta do projeto e do Supabase.
2. Extraia este ZIP em uma pasta separada. A pasta `.git` nao faz parte do pacote (preserve a pasta `.git` atual do seu repositorio).
3. Copie os arquivos e pastas extraidos para o seu repositorio, mantendo os caminhos.
4. No terminal do projeto, execute `node scripts/organize-legacy-root.mjs` para tirar patches e instrucoes antigas da raiz sem excluir versoes diferentes.
5. Execute `npm run validate` e `npm test`.
6. No Supabase, apos backup e revisao, execute `supabase/migrations/MIGRACAO_V2.63.23_APARENCIA_INSTITUCIONAL_R302.sql`.
7. Use `git status` para revisar arquivos movidos. Depois `git add -A`, commit e push; nao use `git push --force`.
8. Em Aparencia > Personalizar experiencia, selecione e salve a imagem institucional comum. Os temas especificos dos Squads continuam separados.

## Riscos e compatibilidade

- A imagem comum e publica nas telas de entrada; utilize somente fotos adequadas para divulgacao.
- Sem a migration, a interface continua neutra e o salvamento da imagem comum nao funciona.
- Arquivos ativos `index.html`, `css/`, `js/`, `assets/`, `supabase/`, `scripts/`, `tests/`, e `.github/` permanecem no mesmo lugar.
- `README.md` foi refeito; o texto anterior esta em `docs/releases/README_HISTORICO_ATE_V2638.md`.
- A R30.2 **nao modifica calculos financeiros, vendas, comissoes ou dados de outubro**.
