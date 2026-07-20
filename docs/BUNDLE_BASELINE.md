# Baseline de bundle

Baseline registrada em 19/07/2026 com `npm run build` depois da migracao modular.

| Chunk | Minificado | Gzip | Observacao |
|---|---:|---:|---|
| `index` | 615,83 kB | 195,13 kB | Acima do aviso de 500 kB do Vite |
| `cameras` | 1.928,15 kB | 532,59 kB | Inclui dependencias pesadas do fluxo de camera/mapa |
| `flood-map` | 25,64 kB | 9,50 kB | Carregado por rota |
| `flood-impact` | 21,82 kB | 7,20 kB | Carregado por rota |
| `demo` | 16,78 kB | 5,82 kB | Carregado por rota |

O build produz chunks por rota, mas ainda emite aviso para `index` e `cameras`. Esta medicao e uma linha de base, nao uma aprovacao do tamanho atual. Evolucoes devem evitar carregar Mapbox/HLS fora das rotas que precisam deles e comparar o relatorio do Vite com estes valores.

O build tambem informa anotacoes `PURE` ignoradas dentro de `@vueuse/core`; o aviso pertence ao codigo da dependencia e nao impede a geracao do bundle.
