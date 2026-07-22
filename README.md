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

## Execute localmente

1. Instale dependências:

```bash
npm install
```

1. Configure `.env` com `VITE_BASE_URL` (e opcionalmente `VITE_HLS_TARGET`).

1. Execute em modo desenvolvimento:

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

## Observações de implementação

- `src/@core/services/api.ts` contém a classe `Api` que instancia Axios com `baseURL: import.meta.env.VITE_BASE_URL` e adiciona automaticamente o cabeçalho `Authorization: Bearer <token>` quando uma requisição é feita com `{ auth: true }` nos headers.
- Em alguns repositórios (ex.: `FloodRepository`), chamadas seguras usam `{ auth: true }` para enviar o token salvo em `localStorage`.
- Para streams HLS em dev, o código reescreve URLs para `/hls` quando `VITE_HLS_TARGET` é configurado, evitando problemas de CORS.

## Execute com Docker

O Compose oferece um serviço de desenvolvimento com hot reload e um serviço de produção servido pelo Nginx. O backend, os streams HLS, Firebase e Mapbox continuam externos.

Copie `.env.sample` para `.env` e preencha `VITE_BASE_URL`, `VITE_HLS_TARGET` (ou `VITE_PROXY_TARGET`), as variáveis Firebase e `VITE_MAPBOX_API_KEY`. O arquivo `.env` é lido pelo Compose, mas não é copiado para a imagem.

Desenvolvimento:

```bash
docker compose up frontend-dev
```

Acesse <http://localhost:5173>. O código é montado no container e `node_modules` permanece em um volume Docker.

Produção:

```bash
docker compose up --build frontend
```

Acesse <http://localhost:8080>. As variáveis `VITE_*` são incorporadas no bundle durante o build; altere o `.env` e execute o rebuild para aplicar mudanças.

Comandos úteis:

```bash
docker compose config
docker compose ps
docker compose exec frontend wget -qO- http://127.0.0.1/health
docker compose down
docker compose build --no-cache frontend
```

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
