# V2.48.2 — Tema persistente no boot/login e carregamento sem flicker

## Problemas corrigidos

A identidade visual das telas públicas dependia do `localStorage`. Ao limpar os dados do navegador, o Performance Hub não sabia qual tema usar antes da autenticação e caía no tema padrão **Brasil em Campo**. Depois do login, o tema correto era recuperado do Supabase.

Também havia uma segunda troca visual após autenticar: a Home podia ser liberada usando o fallback/local cache e o tema real do Squad era buscado somente na hidratação em segundo plano.

## Novo fluxo

1. Se existe tema local válido, ele é aplicado imediatamente para acelerar o primeiro paint.
2. Sem cache local, o boot usa uma identidade neutra da Soften, sem imagem de campanha incorreta.
3. Em modo Supabase e sem sessão autenticada, a RPC `get_public_theme_bootstrap` retorna apenas os campos públicos de identidade visual do tema mais recentemente atualizado da organização.
4. O login só é exibido depois dessa identidade visual ser resolvida.
5. Após autenticar, o tema exato do Squad é carregado antes da interface principal ser liberada.
6. A hidratação em segundo plano deixa de ser responsável pela primeira aplicação do tema.

## Segurança

A migration **não libera SELECT anônimo** em `squad_themes`, `squads` ou `organizations`.

A RPC pública usa `SECURITY DEFINER` e retorna somente campos de ambientação:

- nome e textos da campanha;
- preset;
- paletas e cores;
- fundo;
- favicon;
- opacidade.

Não retorna usuários, metas, indicadores, IDs, meses, dados financeiros, permissões nem outras informações operacionais.

## Migration obrigatória

Execute `MIGRACAO_V2.48.2.sql` no SQL Editor do Supabase antes de publicar a versão.

Sem a migration, o sistema continua funcional, mas em um navegador totalmente limpo usa a identidade neutra da Soften até o usuário autenticar.
