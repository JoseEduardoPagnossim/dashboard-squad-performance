# V2.40.0 — TV / Comunicação

A V2.40.0 transforma o módulo **Apresentação / TV** em uma central de comunicação para múltiplos monitores, preservando as URLs diretas e o carrossel já existentes.

## Playlists

Uma playlist é uma configuração nomeada da apresentação. Ela guarda o Squad, intervalo do carrossel, atualização de dados, densidade, ajuste de tela, escala, margem segura, KPIs, destaques e ordem/seleção das telas.

Fluxo administrativo:
1. Abra `Configurações > Apresentação / TV`.
2. Ajuste a apresentação no editor existente.
3. Crie ou selecione uma playlist.
4. Salve a configuração atual na playlist.
5. Atribua a playlist às TVs cadastradas que devem reutilizá-la.

Alterar uma playlist não exige substituir a URL física da TV. A TV cadastrada consulta novamente sua programação durante a sincronização automática e aplica a versão mais recente.

## TVs cadastradas

Cada TV recebe uma chave exclusiva e uma URL dinâmica no formato:

```text
?view=presentation&tv=<chave-da-tv>
```

Essa URL não contém a configuração visual completa. Ao abrir, a aplicação consulta o dispositivo e a playlist atualmente atribuída. Assim, o administrador pode trocar a programação posteriormente sem acessar fisicamente a TV.

As URLs diretas antigas, com parâmetros como `squad`, `tabs`, `interval`, `fit` e `scale`, continuam compatíveis e não precisam ser migradas imediatamente.

## Monitoramento

Uma TV cadastrada envia heartbeat a cada 30 segundos enquanto estiver aberta no modo de apresentação. O monitor mostra nome, local, playlist, tela atual, última sincronização, última presença e resolução reportada.

Classificação de presença:
- **Online:** heartbeat recebido há até 90 segundos.
- **Atenção:** último heartbeat entre 90 segundos e 5 minutos.
- **Offline:** mais de 5 minutos sem heartbeat.
- **Nunca conectou:** dispositivo cadastrado que ainda não enviou heartbeat.
- **Inativa:** TV desativada administrativamente.

O heartbeat grava somente telemetria operacional; ele não altera playlist, Squad ou regras de apresentação.

## Segurança e Supabase

Execute antes do frontend:

```text
supabase/migrations/MIGRACAO_V2.40.0.sql
```

A migration cria:
- `presentation_playlists`;
- `presentation_devices`;
- RPC `get_presentation_device_config(text)`;
- RPC `touch_presentation_device(text, jsonb)`;
- RLS e grants necessários.

O Admin Geral gerencia TVs e playlists da organização. O Admin de Squad fica limitado ao próprio Squad. A TV continua utilizando uma sessão autenticada da mesma organização; a chave da TV não substitui autenticação.

A RPC de leitura entrega apenas a configuração associada à chave solicitada. A RPC de heartbeat permite atualizar somente os campos de telemetria previstos, impedindo que uma sessão da TV altere sua própria programação.

## Fallback local

Se a migration ainda não existir, a Central mantém playlists e TVs no `localStorage` do navegador administrativo. Esse modo serve para demonstração e contingência, mas não oferece monitoramento compartilhado entre computadores. Para produção, use o Supabase.

## Operação recomendada

1. Executar `MIGRACAO_V2.40.0.sql`.
2. Publicar os arquivos da V2.40.0.
3. Criar as playlists em `Configurações > Apresentação / TV`.
4. Cadastrar cada TV física e atribuir uma playlist.
5. Abrir a URL gerada no navegador da TV e autenticar uma sessão da mesma organização.
6. Confirmar o status **Online** no monitor.
