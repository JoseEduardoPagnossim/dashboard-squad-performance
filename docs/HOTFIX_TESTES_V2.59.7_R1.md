# Hotfix V2.59.7 R1 — sincronização dos testes históricos

## Problema
O patch da V2.59.7 atualizava o código e adicionava o teste novo da versão, mas não incluía os testes históricos que também tiveram as expectativas de versão/cache-buster atualizadas de V2.59.6 / V2.59.6-r1 para V2.59.7.

Ao aplicar apenas o patch sobre a V2.59.6 R1, o GitHub Actions executava código em 2.59.7 contra testes ainda esperando 2.59.6, produzindo 71 falhas de asserção de versão/cache.

## Correção
- atualiza as expectativas de versão corrente nos testes históricos;
- mantém intactas as regras funcionais e de negócio;
- não altera APP_VERSION, fórmulas, migrations ou dados;
- preserva a V2.59.7 funcional.

## Validação
O cenário foi reproduzido a partir de V2.59.6 R1 + patch V2.59.7, resultando em 510/581 testes aprovados e 71 falhas. Após aplicar este hotfix, a mesma base passa integralmente na sequência de CI.
