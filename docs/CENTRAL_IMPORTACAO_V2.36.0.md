# V2.36.0 — Central de Importação

## Objetivo
Reduzir o risco de substituir uma competência com um CSV incorreto e tornar cada carga rastreável.

## Fluxo
1. O administrador escolhe o CSV operacional ou Produto/Empresa.
2. O arquivo é identificado e vinculado aos técnicos.
3. A competência é selecionada.
4. A Central monta uma prévia antes de gravar.
5. O sistema compara o estado atual com o novo arquivo.
6. Erros críticos bloqueiam a importação. Alertas relevantes exigem confirmação digitando `IMPORTAR`.
7. Antes da gravação é criado um snapshot das competências que podem ser alteradas.
8. Se ocorrer erro durante a gravação, o sistema tenta restaurar automaticamente o snapshot anterior.
9. A operação é registrada no histórico.

## Validações
- ausência de linhas válidas;
- valores negativos em campos operacionais;
- competência fechada;
- proporção elevada de linhas ignoradas;
- vínculos não encontrados ou ambíguos;
- queda relevante de atendimentos, técnicos ou avaliações;
- relação de avaliações muito acima do volume de atendimentos.

## Reversão
A última importação concluída pode ser revertida por até 30 minutos. O recurso restaura o snapshot anterior e não é liberado se alguma competência afetada tiver sido fechada após a importação.

## Persistência
O navegador mantém um histórico local. Para compartilhar o histórico entre dispositivos e administradores, aplique `supabase/migrations/MIGRACAO_V2.36.0.sql`, que cria a tabela `public.import_batches` com RLS.
