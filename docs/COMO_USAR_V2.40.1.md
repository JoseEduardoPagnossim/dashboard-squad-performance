# V2.40.1 — Como usar atualizado

Esta versão atualiza a ajuda interna do Soften Performance Hub para refletir o painel consolidado até a V2.40.

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

Explica que o perfil-base continua sendo o limite máximo e permissões específicas apenas restringem acessos já permitidos pelo papel do usuário.

## Perfil do usuário

A ajuda reaproveita as classes de visibilidade por perfil já existentes no painel. Conteúdo administrativo é ocultado para Técnicos e conteúdo exclusivo de Admin Geral fica oculto para Admin de Squad.

Os atalhos também respeitam `data-permission` quando a área depende de uma permissão granular específica.

## Persistência

O guia informa quais recursos dependem das migrations anteriores:

- V2.36.0 — histórico compartilhado da Central de Importação;
- V2.38.0 — preferências de layout e permissões persistentes;
- V2.39.0 — memória financeira compartilhada;
- V2.40.0 — playlists, múltiplas TVs e monitoramento compartilhado.

Não há migration nova na V2.40.1.
