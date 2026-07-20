# Modulos

Cada modulo pertence a um dominio do produto e pode reunir API, tipos, store,
composables, componentes e views. Subpastas so devem existir quando houver
mais de um arquivo com a mesma responsabilidade.

Um modulo pode importar `shared`, mas nao deve acessar arquivos internos de
outro modulo. Integracoes entre modulos usam a API publica declarada pelo
`index.ts` do modulo fornecedor.
