# Compartilhado

Codigo independente de dominio usado por pelo menos dois modulos. O conteudo
de `shared` nao pode importar `modules`.

Componentes compartilhados devem ser controlados por props e eventos, sem
acessar diretamente stores ou APIs de funcionalidades.
