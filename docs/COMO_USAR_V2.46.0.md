# Como usar — V2.46.0

## Central de Alertas

1. Clique no **sino** no cabeçalho para ver os itens recentes.
2. Use **Abrir Central de Alertas** para acessar a visão completa.
3. Filtre por status, origem, prioridade ou categoria.
4. Use **Marcar como lido** em um item ou **Marcar tudo como lido**.
5. Quando o alerta possuir botão de ação, clique nele para ir diretamente ao módulo relacionado.

## Publicar uma notificação interna — Administrador

1. Abra **Central de Alertas**.
2. Clique em **Nova notificação**.
3. Informe título e mensagem.
4. Defina prioridade e categoria.
5. Escolha o público: Todos, Administradores, Técnicos ou Squad específico.
6. Defina início e, se necessário, expiração.
7. Opcionalmente escolha uma tela de destino e o texto do botão.
8. Clique em **Publicar notificação**.

Na parte inferior da Central, o Administrador acompanha as notificações publicadas e pode encerrá-las.

## Banco de dados

No ambiente Supabase, execute `MIGRACAO_V2.46.0.sql` antes de usar publicação e leitura compartilhadas entre usuários.
