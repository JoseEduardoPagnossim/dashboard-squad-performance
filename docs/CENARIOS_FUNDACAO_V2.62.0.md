# V2.62.0 — Fundação de Cenários

A aba Cenários pertence à Gestão Estratégica e herda seus filtros de competência e Squad e suas permissões agregadas. O motor SC-1.0.0 está em `js/strategy-scenarios.js`; recebe os valores oficiais de origem e retorna projeções imutáveis, sem salvar nem escrever no banco. Tipos: custo total, FTE disponível e atendimentos. Variações aceitas entre -100% e +300%. Campos sem fonte válida são indisponíveis, nunca zeros inventados.

Esta etapa é uma fundação de simulação independente: não recalcula automaticamente efeitos indiretos, produtividade, capacidade ou ROI; isso será implementado nas próximas versões V2.62.1–V2.62.5. Persistência e histórico ficam para V2.62.8. Não requer migration.
