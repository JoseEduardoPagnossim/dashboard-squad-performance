# Tema dinâmico — V2.30.1

A imagem definida em **Gestão > Aparência > Imagem de fundo** passa a ser a arte compartilhada da campanha.

Ela é reutilizada em:

- fundo geral do dashboard;
- Hero das telas de desempenho e Squad;
- fundo da tela de login;
- tela de carregamento;
- janela de boas-vindas da trilha sonora;
- card lateral da campanha.

O **Nome do tema** e a **Frase do tema** também alimentam os textos de campanha na lateral, carregamento, boas-vindas e área de ajuda.

O último tema aplicado é mantido em cache local para permitir que login e carregamento usem a identidade visual antes da autenticação. Em um navegador novo, no primeiro acesso ainda é necessário autenticar para que o sistema conheça o tema do Squad; depois disso a identidade fica disponível nas telas pré-login daquele navegador.

O JSON continua sendo a fonte de configuração do tema. O arquivo `docs/examples/tema-brasil-em-campo-premium.json` pode ser usado como exemplo.


## Ajustes V2.30.1
- Hero principal com maior visibilidade da imagem do tema.
- Todos os Squads mantém o último tema visual ativo.
- Login recupera o último tema/squad conhecido no navegador.
