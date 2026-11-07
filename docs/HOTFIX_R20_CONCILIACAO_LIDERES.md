# Hotfix R20 — Conciliação de líderes no CSV

Base: frontend R19 + schema R18. Apply SQL R20 before uploading frontend files.

1. Create a backup of Supabase. Execute `supabase/migrations/MIGRACAO_V2.63.15_CONCILIACAO_LIDERES_R20.sql`.
2. This migration associates the **existing HEITOR DRAGO login** in organization `10000000-0000-0000-0000-000000000001` to Squad **A** for October 2026; it does not change operational metrics.
3. Publish the modified frontend assets (index.html, js/app.js, package metadata if deploying repository).
4. Reopen import, select Heitor Drago Gois — Squad A, then choose HEITOR DRAGO — Líder/Administrador, save alias. No sale is imported by this step.
5. Confirm all pending CSV vendors before final import. Other leaders need their respective squad set in Bonificação for the relevant competence first.

No Supabase writes or CSV imports were performed from this package. Production integration and permissions must be tested in your environment.
