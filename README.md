# Aqua — Frontend (Panorama do projeto)

Este repositório contém o frontend da aplicação Aqua (Análise Pluviométrica). O projeto é uma aplicação web moderna construída com Vue 3 e Vite, com foco em monitoramento pluviométrico, câmeras HLS, mapas e notificações push.

## Visão geral

- Interface responsiva para visualização de pontos de alagamento, câmeras em streaming HLS, previsões e informações contextuais.
- Suporte a PWA (instalação offline) e Firebase Messaging para notificações push.
- Uso de Mapbox para mapas interativos e HLS para vídeo ao vivo (hls.js).
- Arquitetura modular: módulos independentes (auth, flood_management, flood_camera_monitoring, info, payment, profile).

## Tecnologias principais

- Vue 3 + TypeScript
- Vite (dev server e bundler)
- Pinia (state management)
- Vue Router
- Vuetify + Tailwind CSS
- Axios para comunicação HTTP
- vite-plugin-pwa para PWA
- Firebase (cloud messaging)
- Mapbox GL e plugins Mapbox
- Chart.js para gráficos
- tsyringe para injeção de dependências

## Estrutura do repositório (resumo)

- src/
  - App.vue, main.ts
  - @core/: componentes e infra base (serviços, DI, interfaces, composables)
  - @templates/: templates e repositórios base
  - modules/: implementação por domínio (ex.: flood_management, flood_camera_monitoring)
- public/: arquivos estáticos e service workers (ex.: firebase-messaging-sw.js)
- vite.config.ts: aliases, plugins e dev proxy (/api e /hls)

## Variáveis de ambiente

As variáveis usadas pelo Vite devem começar com `VITE_` para ficarem disponíveis no bundle.

- VITE_API_URL: URL base da API (ex.: <https://aquaapi.fabricadesoftware.ifc.edu.br>)
- VITE_HLS_TARGET: (opcional) host de HLS para reescrita via /hls em dev
- VITE_PROXY_TARGET: (opcional) alvo de proxy genérico

Crie um arquivo `.env` na raiz, por exemplo:

```bash
VITE_API_URL=https://aquaapi.fabricadesoftware.ifc.edu.br
VITE_HLS_TARGET=http://192.168.7.10:8000
```

## Como rodar localmente (sem Docker)

1. Instale dependências:

```bash
npm install
```

1. Configure `.env` com `VITE_API_URL` (e opcionalmente `VITE_HLS_TARGET`).

1. Rodar em modo desenvolvimento (HMR):

```bash
npm run dev
```

- O dev server geralmente fica em <http://localhost:5173>.
- O `vite.config.ts` já define proxies úteis para desenvolvimento: `/api` e `/hls`.

Build e preview de produção:

```bash
npm run build
npm run preview
```

## Como rodar com Docker (resumo)

(Se preferir usar Docker, seria necessário um Dockerfile multi-stage e um Nginx para servir o build estático. Este repositório pode ser executado via Docker se você adicionar os arquivos de containerização apropriados.)

## Observações de implementação

- `src/@core/services/api.ts` contém a classe `Api` que instancia Axios com `baseURL: import.meta.env.VITE_API_URL` e adiciona automaticamente o cabeçalho `Authorization: Bearer <token>` quando uma requisição é feita com `{ auth: true }` nos headers.
- Em alguns repositórios (ex.: `FloodRepository`), chamadas seguras usam `{ auth: true }` para enviar o token salvo em `localStorage`.
- Para streams HLS em dev, o código reescreve URLs para `/hls` quando `VITE_HLS_TARGET` é configurado, evitando problemas de CORS.

## Scripts úteis (package.json)

- `npm run dev` — servidor de desenvolvimento (HMR)
- `npm run build` — gera `dist/` para produção
- `npm run preview` — serve o build localmente
- `npm run test:unit` — roda testes unitários com Vitest
- `npm run type-check` — checa tipos com `vue-tsc`
- `npm run lint` — lint/format

## Como contribuir

1. Fork e branch com nome descritivo
2. Abra PR com o que foi alterado e por quê
3. Inclua testes mínimos quando possível

---

Se quiser, posso:

- Adicionar um Dockerfile e docker-compose com instruções passo-a-passo
- Gerar um README mais enxuto em inglês além do PT-BR
- Incluir um diagrama simples da arquitetura

Diga qual opção prefere e eu executo em seguida.
