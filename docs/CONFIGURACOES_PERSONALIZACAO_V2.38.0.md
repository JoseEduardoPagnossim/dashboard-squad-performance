# V2.38.0 — Configurações e personalização

## Objetivo

Centralizar preferências do usuário e permitir restrições operacionais mais específicas sem criar novos perfis de acesso.

## Central de Configurações

A nova tela **Configurações** fica disponível para todos os usuários. Ela reúne:

- layout pessoal de Meu desempenho, Visão do Squad e, quando permitido, Indicadores;
- densidade confortável ou compacta;
- visibilidade e ordem dos principais blocos;
- atalhos administrativos de acordo com as permissões efetivas;
- resumo de governança para Admin Geral.

As preferências são salvas localmente e, após a migração V2.38.0, também no perfil do Supabase para sincronização entre dispositivos.

## Permissões granulares

O papel base continua sendo a fronteira máxima de acesso:

- `super_admin`;
- `squad_admin`;
- `technician`.

As permissões específicas são **restritivas**: o Admin Geral pode retirar capacidades que pertencem ao papel, mas nunca conceder a um papel algo que ele originalmente não possui. Exemplo: marcar `indicators.view` em um técnico não concede Indicadores executivos.

Principais capacidades configuráveis:

- importação de dados;
- metas e referências;
- fechamento/reabertura de competência;
- visualização e edição de bonificação;
- custos;
- feedbacks;
- usuários;
- auditoria;
- aparência;
- apresentação;
- personalização do próprio painel.

## Banco de dados

Executar:

`supabase/migrations/MIGRACAO_V2.38.0.sql`

A migração adiciona `profiles.permissions`, `profiles.ui_preferences` e a RPC `save_my_ui_preferences`.

Sem a migração, o layout pessoal continua funcionando neste navegador via `localStorage`, mas não sincroniza entre dispositivos e as permissões específicas permanecem nos padrões do papel.

## Segurança

As permissões granulares complementam o modelo existente. As fronteiras de dados continuam protegidas pelos papéis e pelas políticas RLS já existentes; os overrides da V2.38 somente reduzem as operações disponíveis dentro do papel base.
