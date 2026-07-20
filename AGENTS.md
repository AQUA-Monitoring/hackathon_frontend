# Aqua frontend

## Estrutura

- `src/app/`: composicao da aplicacao, router, layouts e plugins.
- `src/modules/`: capacidades de dominio. Cada modulo expoe consumidores externos pelo seu `index.ts`.
- `src/shared/`: codigo sem conhecimento de dominio, reutilizado por pelo menos dois modulos.
- `src/views/`: orquestradores de rotas ainda mantidos por compatibilidade durante a migracao.

Arquivos unicos permanecem na raiz do modulo. Crie uma subpasta apenas quando houver pelo menos dois arquivos da mesma responsabilidade. Barrels sao APIs publicas, nao atalhos para expor todos os detalhes internos.

## Fronteiras

- `shared` nunca importa `modules`.
- Um modulo importa outro somente pela API publica (`@/modules/<nome>`).
- Imports relativos podem acessar detalhes internos do proprio modulo.
- `app` pode importar diretamente uma view ou store em imports dinamicos quando isso preservar lazy loading ou evitar ciclos.
- Nao una mapas diferentes apenas porque usam Mapbox.
- Preserve o fluxo `API -> adapter -> store -> composable -> view`.

## Implementacao

Views e componentes devem orquestrar UI; transformacoes ficam em adapters/utilitarios e reatividade reutilizavel em composables. Arquivos acima de 400 linhas ou blocos `<script>` acima de 250 linhas exigem revisao de responsabilidades, sem impor divisoes artificiais.

Preserve a diferenca entre previsao, indício automatizado em camera, relato, ponto cadastrado e ocorrencia confirmada. Nunca apresente classificacao automatica como certeza.

## Verificacao

Execute antes de concluir:

```bash
npm run quality
```

O comando executa type-check, Oxlint, ESLint sem correcoes e build. O projeto nao adota Vitest, Vue Test Utils ou arquivos `*.spec.ts`; complemente os gates com `docs/SMOKE_TEST_MATRIX.md`.
