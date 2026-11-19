# R30.2 - Imagem institucional e organizacao do repositorio

## Diagnostico

O fundo do carregamento e o background geral usavam a variavel CSS `--hero-img`, atualizada a cada mudanca de Squad. Por isso o boot e fundo comum exibiam a imagem do ultimo Squad.

## Implementacao

- Variavel independente `--global-background-img` para tela de carregamento, login e fundo geral.
- `--hero-img` continua sendo exclusivo dos banners, cards e temas de cada Squad.
- Upload independente na area Aparencia, com salvar e remover, exclusivo a administradores.
- Persistencia organizacional via `organization_appearance`, com RLS administrativo e RPC publica que retorna **apenas** a imagem institucional.
- Limite de 2 MB por arquivo JPG/PNG/WEBP (base64 guardado no Supabase). Recomenda-se foto comprimida e nao confidencial.
- A migration precisa ser aplicada antes de usar o botao Salvar imagem comum. Sem migration, o tema dos Squads continua funcionando e o fundo global permanece neutro.
- Arquivos `.patch`, instrucoes temporarias e relatorios historicos foram para `docs/releases/legacy-root/`; nao alteram as rotas de producao.

## Aplicacao

1. Backup no Supabase.
2. Rodar `supabase/migrations/MIGRACAO_V2.63.23_APARENCIA_INSTITUCIONAL_R302.sql`.
3. Publicar repositorio atualizado preservando raiz de GitHub Pages.
4. Abrir **Aparencia > Personalizar experiencia**, carregar e salvar imagem institucional.
5. Conferir boot/login/background e mudar entre Squads A, B, C, D, E. Banners individuais devem permanecer distintos.
6. Rodar `npm run validate` e `npm test`; confira Actions apos o commit.

**Sem atualizacao automatica de imagens ou valores financeiros existentes.**
