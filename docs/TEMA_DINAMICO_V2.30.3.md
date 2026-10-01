# Tema dinâmico V2.30.3

A tela de login e o carregamento acontecem antes de existir uma sessão autenticada. Como `squad_themes` possui leitura restrita ao papel `authenticated`, um navegador sem cache não consegue consultar o tema do Squad nessa etapa.

A V2.30.3 define **Brasil em Campo** como identidade pública/fallback local da aplicação. Isso elimina o retorno visual ao dragão antes do login. Após a autenticação, o tema específico do Squad continua sendo carregado normalmente do Supabase.

A imagem configurada em Aparência continua sendo salva e aplicada às superfícies do tema; no mesmo navegador ela também é lembrada para as telas públicas. Em navegadores novos, antes da autenticação, o fallback Brasil em Campo é usado.
