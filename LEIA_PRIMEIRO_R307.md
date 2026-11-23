# R30.7 — Cópia assistida das premissas financeiras

## Arquivos e implantação

Este ZIP é **incremental e sem uma segunda pasta `dashboard-squad-performance`**. O conteúdo é destinado à raiz do repositório que já contém `index.html` e `.git`.

1. Faça backup da pasta do Dashboard e do Supabase.
2. Em Supabase de **homologação**, execute `supabase/migrations/MIGRACAO_V2.63.24_COPIA_PREMISSAS_R307.sql` no SQL Editor. Teste permissões e somatórios reais antes de executar em produção.
3. Se a homologação passar, aplique a migration na produção.
4. Extraia este ZIP na raiz do projeto e substitua os arquivos correspondentes, sem mover `.git`.
5. Execute `npm run check`. Confirme 1.200 testes aprovados e zero falhas.
6. Faça commit/push e verifique o Quality Gate do GitHub. Após publicação, use `Ctrl+Shift+R`.
7. Em **Gestão Estratégica → Premissas**, escolha uma competência aberta existente e clique em **Copiar do mês anterior**.

## Regras principais

- Salário, encargos e benefícios podem ser copiados para pessoas ativas ainda sem linha de custo no destino.
- FTE e disponibilidade são opcionais; a seleção começa desligada.
- Variável/Bonificação, horas extras, outros custos e provisões nunca são copiados automaticamente.
- Despesas operacionais marcadas como recorrentes ficam pré-selecionadas; despesas eventuais só são copiadas se marcadas manualmente.
- Rateios por FTE e atendimentos usam a base do destino. Rateios manuais não são copiados; sem base de rateio, revisar `UNALLOCATED` antes do fechamento.
- Competências fechadas e custos existentes no destino ficam protegidos.
- A RPC grava auditoria de origem, destino e itens selecionados, sem duplicar valores salariais.

## Importante

O projeto foi testado localmente, mas **não foi possível executar uma transação real em Supabase nesta entrega**. Não considerar a nova migration homologada até validar em um banco de teste.

**Commit sugerido:** `feat: copia premissas financeiras do mes anterior com auditoria (R30.7)`
