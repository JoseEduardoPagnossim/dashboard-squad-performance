# Modo demonstração

O modo demo existe para testar a interface sem Supabase. Ele utiliza apenas dados fictícios gravados no navegador.

Para ativar, altere em `js/config.js`:

```js
mode: 'demo'
```

## Contas demonstrativas

| Perfil | E-mail | Senha |
| --- | --- | --- |
| Admin Geral | `admin.demo@example.local` | `DemoAdmin123!` |
| Admin de Squad | `squad.demo@example.local` | `DemoSquad123!` |
| Técnico Demo 01 | `tecnico01.demo@example.local` | `DemoTech123!` |

Os Técnicos Demo 02 a 08 usam o mesmo padrão de e-mail (`tecnico02...` até `tecnico08...`) e a mesma senha demonstrativa.

Essas contas não correspondem a usuários reais e não devem ser utilizadas em produção.

## Persistência

No modo demo, dados e preferências são armazenados em `localStorage`/`sessionStorage` do navegador. Limpar os dados do site remove esse histórico local.
