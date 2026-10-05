# Modo demonstração

O modo demo existe para testar a interface sem Supabase. Ele utiliza apenas dados fictícios gravados no navegador.

Para ativar, altere em `js/config.js`:

```js
mode: 'demo'
```

## Contas demonstrativas

| Perfil | E-mail | Senha |
| --- | --- | --- |
| Administrador Demo 01 | `admin.demo@example.local` | `DemoAdmin123!` |
| Administrador Demo 02 | `gestor.demo@example.local` | `DemoAdmin123!` |
| Técnico Demo 01 | `tecnico01.demo@example.local` | `DemoTech123!` |

Os Técnicos Demo 02 a 08 usam o mesmo padrão de e-mail (`tecnico02...` até `tecnico08...`) e a mesma senha demonstrativa.

A partir da V2.43.2 não existe conta demo de Admin de Squad. Os dois administradores possuem acesso global, igual ao modelo real da aplicação.

Essas contas não correspondem a usuários reais e não devem ser utilizadas em produção.

## Persistência

No modo demo, dados e preferências são armazenados em `localStorage`/`sessionStorage` do navegador. Limpar os dados do site remove esse histórico local.
