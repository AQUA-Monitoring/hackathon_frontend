# Matriz de verificacao manual do frontend

Esta matriz complementa `npm run quality`. Ela deve ser executada nos fluxos
afetados antes de cada checkpoint ou entrega. A verificacao manual nao comprova
implantacao em producao nem disponibilidade de integracoes externas.

## Preparacao

- iniciar o frontend com a configuracao local autorizada;
- registrar viewport, tema, branch e commit avaliados;
- usar apenas contas, cameras e dados de desenvolvimento autorizados;
- nao registrar tokens, URLs privadas ou imagens sensiveis nas evidencias.

## Cameras e navegacao

- abrir `/cameras` diretamente e pela navegacao principal;
- aplicar, limpar e restaurar filtros pela URL, incluindo voltar e avancar;
- abrir `/cameras?view=map` e confirmar que a URL legada exibe normalmente a grade, sem restaurar o mapa removido;
- validar o grid em `360`, `768`, `1280` e `1600px`: uma coluna no mobile, duas no tablet e ate quatro no desktop amplo, sem esticar poucos cards;
- alternar os tamanhos `320`, `360`, `400` e `Automatico`; recarregar e confirmar a preferencia, com `Automatico` em `320px`;
- usar titulos e enderecos de uma e duas linhas, cameras ativas, offline e inativas, e confirmar previa `16:9`, cards com a mesma altura e CTAs alinhados;
- selecionar uma camera, abrir o detalhe e retornar para a listagem;
- carregar mais resultados sem perder filtros ou selecao;
- diferenciar carregamento, lista vazia, erro, stream indisponivel e analise ausente;
- confirmar que uma classificacao automatica permanece descrita como indicio.
- alterar o estado administrativo: `ACTIVE` deve permitir transmissão e análise, `OFFLINE` somente transmissão e `INACTIVE` nenhum dos dois;
- na pagina de detalhe, abrir cameras proximas em sequencia e confirmar que URL, titulo, video e analise acompanham a nova camera;
- como admin, editar transmissao, status e endereco; confirmar erro de validacao de endereco legivel e preservacao do formulario.
- em `/admin/cameras`, abrir `Alterar no mapa`, selecionar outro ponto e confirmar preenchimento de latitude, longitude, bairro e rua;
- em `/admin/cameras`, aplicar busca, regiao, bairro, estado administrativo, transmissao e analise; confirmar contador, limpar/aplicar, paginação e selecao na URL;
- selecionar uma regiao e confirmar que o seletor oferece apenas bairros vinculados; trocar a regiao, voltar/avancar e confirmar que bairro incompatível e removido antes da consulta;
- editar uma camera, tentar filtrar, atualizar, fechar, trocar a selecao ou abrir `Alterar no mapa` e confirmar o dirty guard; ao voltar do mapa, preservar filtros e camera selecionada;
- pesquisar bairro digitando parte do nome e rua pelo catálogo da cidade, sem abrir listas extensas;
- confirmar que uma camera `OFFLINE` mostra a fonte de transmissão e análise suspensa, sem o rótulo genérico `Transmissão indisponível`.
- confirmar que a visão geral carrega câmeras administrativamente ativas por padrão e mantém todas as câmeras `OFFLINE` na grade, inclusive após `Carregar mais`;
- confirmar que o card `OFFLINE` exibe `Câmera offline` e `Sem análise automática · somente transmissão`, sem data, probabilidades ou modelo;
- inspecionar uma câmera `OFFLINE` com fonte e confirmar autoplay mudo, pausa e retomada; simular falha HLS e confirmar a mensagem de indisponibilidade;
- confirmar que câmera `OFFLINE` sem fonte e câmera `INACTIVE` não montam player ativo, e que `INACTIVE` preserva seu estado sem análise;
- confirmar que o catálogo local da Home percorre todas as páginas da API sem alterar filtros, paginação ou seleção da visão geral compartilhada;
- na grade administrativa, conferir que somente prioridades `ACTIVE`, com stream `ONLINE` e análise `AVAILABLE` completa aparecem, ordenadas por percentual alagado, data da análise e descrição/id;
- na home administrativa, escolher uma câmera próxima e confirmar que a seleção permanece no painel local sem navegar para outra rota;
- bloquear autoplay no navegador e confirmar o botão explícito `Reproduzir transmissão`, sem mensagem de erro HLS;
- na home administrativa, confirmar no máximo quatro cards em duas colunas quando houver espaço e uma coluna no viewport estreito;
- na Home pública, selecionar um marcador e confirmar que o showcase troca para exatamente essa câmera, fecha contexto flood/territory e não navega; somente `Inspecionar câmera` deve abrir `/cameras/:id`;
- trocar rapidamente entre marcadores e confirmar que uma resposta de detalhe antiga não substitui vídeo, situação, percentual ou data da câmera atual;
- clicar diretamente em um polígono ativo e confirmar contexto primário do ponto, duração, todos os bairros e câmeras relacionadas sem players adicionais;
- confirmar que as câmeras relacionadas ao polígono são somente `ACTIVE` com coordenadas dentro ou exatamente na borda do `Polygon`/`MultiPolygon`, preservando a ordem do catálogo;
- clicar em território com associação e confirmar câmeras primeiro e pontos ativos depois; território sem associações, heatmap isolado e área vazia devem fechar e limpar o painel;
- confirmar que ponto multi-bairro aparece no contexto de cada bairro associado e que câmera `INACTIVE` nunca aparece;
- no desktop, confirmar painel esquerdo único com tabela rolável + showcase e contexto flood/territory independente à direita;
- no mobile, confirmar um único dock na safe-area: abrir flood/territory sem câmeras desmonta o showcase/HLS e exibe o contexto; fechar o contexto restaura a mesma câmera selecionada, enquanto clicar em heatmap isolado, território sem associações ou área vazia desmonta todo o dock sem apagar a seleção;
- após dispensar o dock no mobile, tocar em qualquer marcador, inclusive o já selecionado, deve reabrir o showcase; flood com câmeras deve manter ou reabrir o carrossel filtrado;
- quando o alagamento tiver câmeras, confirmar carrossel filtrado com contagem, setas entre todas as câmeras contidas e `Ver todas` restaurando catálogo e seleção global; sem câmera, exibir somente o resumo do ponto;
- alternar rapidamente câmera e contexto no mobile e confirmar no máximo um player HLS montado, sem áudio automático e sem resposta antiga;
- em câmeras relacionadas de ponto/território, abrir a transmissão no contexto local sem navegar; somente o CTA explícito `Inspecionar câmera` deve abrir `/cameras/:id`;
- na visão geral, carregar mais de uma página, selecionar uma câmera e usar `Atualizar dados`; filtros, páginas, seleção e conteúdo devem permanecer enquanto as páginas `1..currentPage` são substituídas atomicamente;
- confirmar `Última atualização` e revalidação apenas por GET ao recuperar foco, visibilidade ou conexão após o limite, sem chamadas `predict/all`;
- validar painel e dock em temas claro/escuro; fechar contexto por botão e Escape sem mover foco automaticamente;
- em outro uso do mapa sem modo de seleção, confirmar que o marcador continua abrindo diretamente a página da câmera;
- na home administrativa, confirmar reprodução HLS de `preview_url` nos quatro cards quando disponível, células vazias até completar 2×2 e que somente o botão `Inspecionar` abre o painel local;

## Mapas e territorio

- montar, desmontar e remontar cada mapa sem controles ou marcadores duplicados;
- selecionar coordenadas em Joinville e Araquari e confirmar nomes próprios de bairros, sem rótulos genéricos como `Bairro N`;
- conferir `Costa e Silva`, `Morro do Meio`, `Jardim Iririú`, `Boehmerwald` e `Zona Industrial Norte/Tupy` no mapa e nos seletores;
- validar camadas de cameras, pontos, previsao e impacto separadamente;
- abrir e fechar popups e selecionar itens pelo mapa e pela lista;
- no cadastro, desenhar poligono e raio, editar e limpar o rascunho;
- confirmar que navegacao e troca de tema nao deixam listeners ativos aparentes.

## Demo e video

- validar loading, reproducao, erro de stream e recuperacao;
- confirmar que `/hls/playlist.m3u8` retorna uma playlist M3U pela mesma origem, nunca o HTML da SPA;
- em navegador com H.264 High 3.1, confirmar reproducao, aproximadamente um segmento novo a cada 2 s e chamadas de predicao sem falhas;
- em navegador sem o codec exigido, confirmar mensagem de incompatibilidade, zero requisicoes HLS e ausencia de loop de recuperacao;
- após a primeira análise, confirmar que o último resultado permanece visível como `Trecho anterior — atualizando análise` até a promoção atômica do trecho atual;
- confirmar que respostas concluídas fora de ordem não substituem uma sequência mais recente e que mudança de sessão/modelo limpa o histórico automático;
- alternar visibilidade da pagina e conectividade durante o polling;
- confirmar que respostas antigas nao substituem uma sessao mais recente;
- confirmar que apenas usuario admin ve e usa controles de mudanca de estado;
- distinguir estado esperado, resultado do modelo e indisponibilidade.

## Autenticacao e formularios

- validar login, cadastro, recuperacao, logout e expiracao da sessao;
- abrir rotas protegidas sem sessao e confirmar o retorno apos autenticar;
- confirmar bloqueio das rotas administrativas para usuario nao admin;
- validar formularios de perfil, camera e ponto nos estados valido e invalido;
- confirmar preservacao dos dados ao navegar em formularios com multiplas etapas.

## Blog

- abrir diretamente `/blog/:id` e atualizar a pagina, confirmando o carregamento da noticia pelo endpoint de detalhe;
- abrir uma noticia com referencia e confirmar o bloco ao fim do conteudo, o nome da fonte e a abertura segura da URL em nova aba;
- abrir uma noticia sem referencia e confirmar que nenhum bloco ou espaco vazio e exibido;
- acessar um ID inexistente e confirmar a mensagem `Notícia não encontrada` e o link de retorno ao blog.

## Interface e acessibilidade

- repetir os fluxos prioritarios em mobile e desktop;
- percorrer controles por teclado e verificar foco visivel;
- confirmar rotulos acessiveis e textos para estados comunicados por cor;
- verificar loading, vazio, erro e indisponibilidade nos temas claro e escuro.
- em `/admin/alertas`, usar o mesmo painel expansivel de filtros, selecionar regiao e bairro, buscar camera pelo combobox com debounce e validar loading, vazio e seleção;
- em `/admin/alertas`, combinar estado, regiao, bairro, camera e periodo, paginar e confirmar que limpar filtros restaura a consulta sem UUIDs digitaveis;
- simular indisponibilidade do catalogo territorial nas tres telas e confirmar regiao/bairro desabilitados, mensagem legivel e demais filtros operantes.

## Registro do resultado

Para cada fluxo executado, registrar: commit, ambiente, viewport, resultado,
falhas, integracoes indisponiveis e verificacoes nao executadas.
