# V2.43.2 — Como usar atualizado

Esta versão atualiza a ajuda interna do Soften Performance Hub para refletir o painel consolidado até a V2.43.2.

## Objetivo

A tela **Como usar** deixa de ser um resumo histórico e passa a funcionar como manual operacional do próprio sistema. O conteúdo foi organizado para responder três perguntas:

1. **Onde fica a função?**
2. **Quando devo usar esta tela?**
3. **Qual é o fluxo correto para não comprometer o histórico?**

## Estrutura do guia

- busca por palavra-chave dentro da própria ajuda;
- atalhos para as áreas principais;
- quatro passos de rotina: atualizar, acompanhar, configurar e fechar;
- mapa completo dos módulos;
- guias expansíveis para os fluxos críticos;
- matriz de permissões atualizada;
- rotina mensal recomendada;
- orientações sobre persistência e migrations.

## Fluxos documentados

### Início / Home

É a primeira tela depois do login. Ela resume o contexto mais importante sem exigir que o usuário escolha um módulo antes de entender como está a operação.

- **Técnico:** acompanha seus principais KPIs, alertas e atalhos pessoais.
- **Administrador:** acompanha o consolidado da organização, todos os Squads, projeções, alertas e ações administrativas.

Quando não houver dados, a Home e os módulos críticos devem exibir uma orientação clara em vez de uma área vazia. Use os botões do próprio estado vazio para importar dados ou consultar este guia quando disponíveis.

### Central de Importação

Explica prévia, comparação Atual × Novo, validações, risco, confirmação reforçada, checksum, histórico, reversão de até 30 minutos e restauração automática em falha parcial.

### Operação e metas

Explica separação entre tela operacional e `Configurações > Operação e metas`, base elegível, atendimentos sem avaliação, referências, status e fechamento/reabertura.

### Gestão preditiva

Documenta Realizado × Meta × Projeção, confiança, comparação equivalente por dias úteis e interpretação dos alertas automáticos.

### Financeiro avançado

Explica Base do Squad, Individual, férias somente sobre a comissão-base após cancelamento, memória de cálculo, versão/assinatura das regras, simulador sem gravação e explicação passo a passo.

### Central de Configurações

Reforça a regra de arquitetura da V2.38.1: **configuração altera comportamento; tela do módulo trabalha os dados**.

### TV / Comunicação

Documenta playlists, cadastro de múltiplas TVs, URL fixa por dispositivo, atualização remota da programação, autenticação e monitoramento por heartbeat.

Estados do monitor:

- Online: até 90 segundos;
- Atenção: entre 90 segundos e 5 minutos;
- Offline: acima de 5 minutos;
- Inativa: desabilitada pelo gestor.

### Usuários e permissões

Explica os dois perfis ativos: Administrador e Técnico. Administradores possuem acesso completo; restrições específicas existem somente para reduzir recursos já permitidos ao Técnico.

## Perfil do usuário

A ajuda reaproveita as classes de visibilidade por perfil já existentes no painel. Conteúdo administrativo é ocultado para Técnicos. Administradores possuem acesso completo a todos os Squads e módulos. Os atalhos continuam respeitando `data-permission` para o perfil Técnico quando aplicável.

## Persistência

O guia informa quais recursos dependem das migrations anteriores:

- V2.36.0 — histórico compartilhado da Central de Importação;
- V2.38.0 — preferências de layout e permissões persistentes;
- V2.39.0 — memória financeira compartilhada;
- V2.40.0 — playlists, múltiplas TVs e monitoramento compartilhado;
- V2.42.0 — avatar privado no Supabase Storage e `profiles.avatar_path`.

A navegação V2.42 reutiliza `ui_preferences`; somente o recurso de foto exige a migration V2.42.0.


## Navegação V2.42

No desktop, use a seta no topo do menu lateral para alternar entre o modo completo e o modo compacto. Desempenho, Gestão e Conta podem ser recolhidos individualmente. Em Gestão, Financeiro, Pessoas e Governança funcionam como submódulos recolhíveis. Essas escolhas são pessoais e ficam salvas em `ui_preferences`.

## Foto do perfil V2.42

Abra **Meu perfil → Foto do perfil**. Escolha um JPG, PNG ou WebP. Antes do envio, o navegador recorta, redimensiona e converte a imagem para WebP; somente a versão otimizada é armazenada. Para usar o recurso com Supabase, aplique `MIGRACAO_V2.42.0.sql`.


## Carregamento progressivo V2.43

Ao entrar, a **Home é liberada primeiro** com o contexto essencial. Telas que exigem detalhes — como Meu desempenho, Indicadores, Bonificação ou períodos antigos — podem exibir por alguns instantes o indicador **Carregando dados...** enquanto a competência é hidratada. Isso é esperado e evita bloquear todo o sistema no login.

O painel mantém cache de sessão para reduzir consultas repetidas. Após importações, fechamento/reabertura de competência e alterações relevantes, os caches são invalidados automaticamente.

Para diagnóstico técnico, o navegador disponibiliza `window.SoftenPerformanceDiagnostics.latest`, que mostra o tempo medido até a interface utilizável.

Para obter o ganho máximo, aplique `MIGRACAO_V2.43.0.sql`, responsável pela RPC inicial e índices de apoio. Sem ela, existe fallback otimizado, mas o login pode fazer mais chamadas ao Supabase.


## Performance V2.43.1

Administrador pode abrir **Configurações → Performance** para acompanhar velocidade e estabilidade.

- **Último login:** tempo desta sessão até a interface utilizável.
- **Média de login:** média histórica dos últimos 7 dias.
- **P95:** 95% dos logins registrados ficaram abaixo desse valor.
- **Cache hit:** proporção de leituras atendidas pelo cache da sessão.
- **Long tasks:** tarefas longas detectadas no navegador.
- **Carregamentos mais lentos:** ranking por módulo/visão, com média, P95 e máximo.
- **Erros recentes:** mensagens curtas de falhas de runtime, sem stack completo ou dados de negócio.

Use **Exportar diagnóstico** para gerar um JSON quando precisar comparar uma sessão lenta com uma sessão normal.

A persistência histórica depende de `MIGRACAO_V2.43.1.sql`. Sem ela, o diagnóstico local continua disponível e o desempenho do login não é afetado.


## Perfis e permissões V2.43.2

O sistema possui somente dois perfis ativos:

- **Administrador:** acesso completo a todos os Squads e módulos administrativos; não recebe restrições individuais.
- **Técnico:** acesso operacional ao próprio escopo; restrições específicas podem somente remover recursos já permitidos pelo perfil-base.

O antigo **Admin de Squad** foi descontinuado. A migration `MIGRACAO_V2.43.2.sql` converte registros legados para Administrador global. O valor histórico `squad_admin` pode permanecer no schema por compatibilidade, mas não aparece na interface nem é criado pelas Edge Functions atuais.

Ao cadastrar um usuário, escolha apenas **Administrador** ou **Técnico**. Para Técnicos, informe corretamente o Squad e o nome usado no CSV.
