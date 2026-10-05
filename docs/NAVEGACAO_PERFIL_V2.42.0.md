# V2.42.0 — Navegação retrátil e avatar

## Objetivo

Reduzir a ocupação visual da lateral, organizar a quantidade crescente de módulos e permitir identificação visual do usuário sem transformar o banco em repositório de imagens pesadas.

## Navegação

### Sidebar retrátil

No desktop, a seta ao lado da marca alterna entre:

- **expandida:** 260 px, com ícone e nome dos módulos;
- **recolhida:** 76 px, exibindo os ícones. O nome continua disponível pelo tooltip nativo.

No celular e tablet a navegação continua funcionando como drawer. O recolhimento de largura não é aplicado abaixo de 981 px.

### Grupos e submódulos

A lateral passa a ter dois níveis no máximo:

- **Desempenho** — Início, Meu desempenho, Visão do Squad, Indicadores e Apresentação;
- **Gestão** — Operação; Financeiro (Bonificação/Custos); Pessoas (Feedbacks/Usuários); Governança (Auditoria/Aparência);
- **Conta** — Meus feedbacks, Configurações, Meu perfil, Como usar e Sair.

Os grupos e subgrupos podem ser recolhidos. Em modo compacto, todos os ícones autorizados ficam disponíveis para evitar que um item desapareça por causa do estado de um acordeão.

### Persistência

O estado é guardado em `profiles.ui_preferences.navigation`:

```json
{
  "sidebarCollapsed": true,
  "groups": {"performance": false, "management": false, "account": false},
  "subgroups": {"finance": false, "people": true, "governance": false}
}
```

A preferência também possui fallback em `localStorage`. A migration V2.38.0 continua sendo responsável por `ui_preferences`; a V2.42 não cria uma segunda estrutura para navegação.

## Avatar do usuário

### Estratégia de armazenamento

A imagem **não** é salva em Base64 dentro de `profiles`. O frontend:

1. aceita JPG, PNG ou WebP de até 5 MB;
2. recorta o centro em formato quadrado;
3. redimensiona para no máximo 256 × 256 px;
4. converte para WebP;
5. reduz qualidade/tamanho até o alvo de 100 KB;
6. envia somente o resultado otimizado ao bucket privado `user-avatars`.

O caminho canônico é:

```text
<organization_id>/<user_id>.webp
```

Em `profiles.avatar_path` fica apenas esse caminho. O bucket limita cada objeto a 128 KB.

### Segurança

- bucket privado;
- usuários autenticados podem ler avatars apenas da própria organização;
- cada usuário só pode inserir, substituir ou excluir o próprio arquivo canônico;
- `save_my_avatar_path()` valida o caminho antes de atualizar o perfil.

### Onde a foto aparece

- topo do sistema;
- Home;
- Meu perfil.

A tela de administração de usuários continua com iniciais. Isso é proposital para evitar gerar uma URL assinada para cada pessoa da lista e manter a V2.42 neutra em relação ao tempo de carregamento.

## Migração

Execute:

```text
supabase/migrations/MIGRACAO_V2.42.0.sql
```

Sem a migration:

- sidebar/grupos/submódulos funcionam normalmente;
- avatar continua usando iniciais;
- o envio da foto ao Supabase não fica disponível.
