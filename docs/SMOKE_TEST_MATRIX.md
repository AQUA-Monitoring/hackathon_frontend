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
- alternar lista e mapa em viewport mobile;
- aplicar, limpar e restaurar filtros pela URL, incluindo voltar e avancar;
- selecionar uma camera, abrir o detalhe e retornar para a listagem;
- carregar mais resultados sem perder filtros ou selecao;
- diferenciar carregamento, lista vazia, erro, stream indisponivel e analise ausente;
- confirmar que uma classificacao automatica permanece descrita como indicio.
- alterar o estado administrativo: `ACTIVE` deve permitir transmissão e análise, `OFFLINE` somente transmissão e `INACTIVE` nenhum dos dois;
- na pagina de detalhe, abrir cameras proximas em sequencia e confirmar que URL, titulo, video e analise acompanham a nova camera;
- como admin, editar transmissao, status e endereco; confirmar erro de validacao de endereco legivel e preservacao do formulario.
- em `/admin/cameras`, abrir `Alterar no mapa`, selecionar outro ponto e confirmar preenchimento de latitude, longitude, bairro e rua;
- pesquisar bairro digitando parte do nome e rua pelo catálogo da cidade, sem abrir listas extensas;
- confirmar que uma camera `OFFLINE` mostra a fonte de transmissão e análise suspensa, sem o rótulo genérico `Transmissão indisponível`.
- confirmar que a visão geral carrega câmeras administrativamente ativas por padrão e mantém todas as câmeras `OFFLINE` na grade e no mapa, inclusive após `Carregar mais`;
- confirmar que o card `OFFLINE` exibe `Câmera offline` e `Sem análise automática · somente transmissão`, sem data, probabilidades ou modelo;
- confirmar que o marcador `OFFLINE` permanece neutro mesmo quando há classificação histórica e que o fallback textual do mapa comunica o estado sem depender de cor;
- inspecionar uma câmera `OFFLINE` com fonte e confirmar autoplay mudo, pausa e retomada; simular falha HLS e confirmar a mensagem de indisponibilidade;
- confirmar que câmera `OFFLINE` sem fonte e câmera `INACTIVE` não montam player ativo, e que `INACTIVE` preserva seu estado sem análise;

## Mapas e territorio

- montar, desmontar e remontar cada mapa sem controles ou marcadores duplicados;
- validar camadas de cameras, pontos, previsao e impacto separadamente;
- abrir e fechar popups e selecionar itens pelo mapa e pela lista;
- no cadastro, desenhar poligono e raio, editar e limpar o rascunho;
- confirmar que navegacao e troca de tema nao deixam listeners ativos aparentes.

## Demo e video

- validar loading, reproducao, erro de stream e recuperacao;
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

## Interface e acessibilidade

- repetir os fluxos prioritarios em mobile e desktop;
- percorrer controles por teclado e verificar foco visivel;
- confirmar rotulos acessiveis e textos para estados comunicados por cor;
- verificar loading, vazio, erro e indisponibilidade nos temas claro e escuro.

## Registro do resultado

Para cada fluxo executado, registrar: commit, ambiente, viewport, resultado,
falhas, integracoes indisponiveis e verificacoes nao executadas.
