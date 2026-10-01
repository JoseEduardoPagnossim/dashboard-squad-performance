# Apresentação para TV — Etapa 3 (V2.33.0)

A V2.33.0 prepara o módulo **Apresentação** para permanecer aberto continuamente em televisores e monitores.

## Entregas

### Carrossel contínuo
- Mantém as seis telas da Etapa 2.
- Troca automática a cada 20 segundos.
- Exibe barra de progresso e contador regressivo para a próxima tela.
- Uma troca manual pausa o carrossel por 60 segundos e depois retoma sozinho.
- O carrossel pausa quando a aba do navegador fica em segundo plano e reinicia o ciclo ao voltar.

### Fullscreen e operação por teclado
- Botão de tela cheia continua disponível no cabeçalho.
- Duplo clique em uma área livre da apresentação entra em tela cheia.
- Atalho `F`: entra/sai da tela cheia.
- Atalho `Espaço`: pausa/retoma o carrossel.
- Setas esquerda/direita: mudam a tela manualmente.
- Atalho `R`: solicita atualização dos dados.
- Em URL direta de apresentação, o sistema tenta manter a tela acordada usando Screen Wake Lock quando o navegador oferece suporte.

> Navegadores normalmente exigem interação do usuário para entrar em fullscreen. Por isso o sistema não força tela cheia automaticamente ao abrir a URL.

### Atualização automática
- Atualização dos dados a cada 5 minutos.
- Botão **Atualizar agora** para sincronização sob demanda.
- Ao recuperar foco depois de muito tempo, o sistema atualiza se já tiver passado o intervalo normal.
- O reload reutiliza a sessão Supabase existente e não exige nova importação de CSV.
- O tema do Squad também pode ser atualizado durante a sincronização.

### Queda de conexão
- Se a internet cair, a apresentação continua mostrando o último conjunto de dados carregado em memória.
- Um indicador no cabeçalho muda para **Sem conexão**.
- Um aviso informa que os dados exibidos são os últimos disponíveis.
- Há tentativa automática de recuperação a cada 1 minuto.
- Quando o navegador detecta a volta da internet, a sincronização é disparada automaticamente.
- Se o Supabase falhar mesmo com internet ativa, o painel entra em estado de atenção sem apagar os dados já exibidos.

## URL direta

Exemplos:

```text
?view=presentation&squad=all
?view=presentation&squad=D
```

A sessão autenticada continua sendo necessária para ler os dados protegidos do Supabase.
