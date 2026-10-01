# Módulo Apresentação — Etapa 1 (V2.31.0)

## Objetivo
Integrar ao Performance Hub a base do monitor de TV, eliminando a necessidade de importar o mesmo CSV em um segundo sistema.

## Entregue nesta etapa
- Novo item **Apresentação** no menu Desempenho.
- Nova view nativa `view-presentation`.
- URL direta para TV via `?view=presentation`.
- Parâmetro opcional de Squad: `?view=presentation&squad=D` ou `?view=presentation&squad=all` para Admin Geral.
- A URL direta abre o painel sem sidebar/topbar após a sessão ser validada.
- Se não houver sessão no navegador, o login continua sendo solicitado; após o login, o usuário é levado automaticamente à apresentação.
- A apresentação usa os dados já existentes no Performance Hub/Supabase, sem nova importação de CSV.
- Resumo com técnicos, atendimentos, avaliações, média e percentual avaliado.
- Ranking funcional inicial por atendimentos.
- Botões para copiar URL, abrir em nova tela e solicitar tela cheia.
- Estrutura separada em `css/presentation.css` e `js/presentation.js`.

## URLs
Apresentação usando o escopo padrão da sessão:

`https://joseeduardopagnossim.github.io/dashboard-squad-performance/?view=presentation`

Squad D:

`https://joseeduardopagnossim.github.io/dashboard-squad-performance/?view=presentation&squad=D`

Todos os Squads (Admin Geral):

`https://joseeduardopagnossim.github.io/dashboard-squad-performance/?view=presentation&squad=all`

## Segurança nesta etapa
A apresentação continua usando a autenticação e as permissões já existentes no Performance Hub. Não foi criada leitura pública no Supabase nesta etapa.

Isso permite colocar a URL na TV e autenticar uma única vez no navegador. Como a sessão do Supabase é persistida no mesmo domínio, acessos seguintes entram diretamente no módulo enquanto a sessão permanecer válida.

## Próxima etapa
Portar as seis telas do `app_ranking` e o carrossel automático:
1. Finalizados do Dia
2. Notas do Dia
3. Finalizados Geral
4. Notas Geral
5. Finalizados por Grupo
6. Notas por Grupo

A Etapa 2 deve preservar os cálculos e a lógica funcional do monitor existente, substituindo apenas a origem dos dados pelo Performance Hub.
