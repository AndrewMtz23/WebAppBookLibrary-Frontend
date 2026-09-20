# Entrada pública y acciones con autenticación

Estado: propuesta revisada contra el código; pendiente de revisión del documento antes del plan de implementación. Fecha: 20 de septiembre de 2026.

## Propósito y alcance acordado

Permitir conocer la biblioteca antes de crear una cuenta. `/` y `/app` llevan a `/app/discover`; Descubrir, catálogo y ficha son públicos. El navbar de visitante muestra «Iniciar sesión» y «Registrarse» donde hoy aparece la cuenta. Reservar físico/digital y guardar requieren sesión: el visitante recibe una modal con opciones de acceso y puede seguir explorando sin abandonar la ficha.

No se ejecuta automáticamente la acción después del login. Se conserva el destino, se recarga el estado del libro y el lector confirma de nuevo. Se mantienen los permisos actuales: solo lectores reservan/guardan; administración y bibliotecario conservan sus funciones. Abrir la portada o leer la descripción no equivale a abrir el recurso digital.

## Hallazgos en el proyecto

- `app.routes.ts` usa `landingRouteForRole` también en la raíz. Separar la entrada pública del destino de login: login sin retorno válido conserva el dashboard de cada rol.
- `reader.routes.ts` protege todo el shell con AuthGuard/RoleGuard. Al retirar esa protección del padre hay que añadir autenticación explícita a Mi biblioteca, Favoritos y Perfil, además de los roles actuales. Un enlace directo sigue protegido.
- `BooksController` tiene `[Authorize]` de clase. Abrir solo GET listado, GET ficha y GET facets; mantener protegidos management, escrituras y acceso digital. Los contratos de listado/ficha ya omiten DigitalResourceUrl y el servicio acepta identidad nula.
- Descubrir ya evita cargar actividad si el rol no es lector. Revisar también el shell y los consumidores del catálogo para evitar cualquier petición privada de un visitante.
- Las acciones de ficha, relacionados y tarjetas hoy dependen de `isReader`: no basta con abrir las rutas; hay que hacer visibles las acciones para visitantes e interceptar sus intentos antes de llamar a las facades.
- El interceptor convierte cualquier 401 en expiración. Distinguir credenciales incorrectas, visitante y sesión realmente expirada; un visitante no debe entrar en un bucle de login.
- El login valida returnUrl, pero su enlace al registro y el registro de vuelta al login lo pierden. Conservarlo durante todo el recorrido, incluida navegación manual entre formularios.
- FavoritesFacade es global y conserva overrides/lista. Limpiar datos personales y cancelar/ignorar respuestas pendientes al cerrar sesión o cambiar de cuenta; lo mismo para feedback/reservas y datos personalizados del catálogo.

## Alternativas

1. **Reutilizar vistas y permitir solo lecturas anónimas (recomendada).** Un catálogo y una ficha, mismo diseño y URLs; las acciones personales tienen una comprobación compartida de sesión. Menor duplicación y alcance contenido.
2. Catálogo público y API separados: útil si los datos públicos fueran distintos; hoy duplicaría contratos, filtros y pantallas sin una necesidad confirmada.
3. Landing promocional pública con catálogo protegido: pequeña, pero no satisface explorar fichas sin cuenta.

## Contrato de navegación y datos

| Destino | Visitante | Cuenta autenticada |
|---|---|---|
| `/`, `/app` | Descubrir | Descubrir |
| Descubrir, catálogo, ficha | Lectura pública de libros activos | Lectura según permisos vigentes |
| Mi biblioteca, Favoritos | Login con retorno validado | Solo lector |
| Perfil | Login con retorno validado | Los tres roles |
| Admin / bibliotecario | Login con retorno validado | Roles autorizados |

No modificar globalmente `landingRouteForRole` para lograr la redirección de raíz. Las cuentas del personal mantienen acceso a su panel desde el menú.

El visitante no ve bloques de actividad personal ni favoritos heredados. No se consulta dashboard, préstamos, perfil o favoritos sin sesión. Un ID inexistente/inactivo no expone su ficha pública. Se conserva la paginación máxima y los filtros permitidos. No se crean usuarios invitados ni datos ficticios en la base real.

No incorporar caché pública compartida de respuestas con `isFavorite` u otra personalización. Al cambiar identidad, invalidar y recargar los datos correspondientes. El acceso digital sigue requiriendo el endpoint autorizado y una reserva activa; nunca enviar la URL privada en el catálogo público.

## Modal compartida

Título: «Inicia sesión para continuar». Descripción contextual: «Para reservar este libro necesitas una cuenta» o «Para guardar este libro en tus favoritos necesitas una cuenta». Acciones: Iniciar sesión, Crear cuenta y Seguir explorando.

Se abre desde la ficha, tarjetas de catálogo/Descubrir y relacionados donde exista Guardar o Reservar. Los clics de favorito no deben disparar también la navegación de la tarjeta. Una sola modal aunque haya clics repetidos. Sin sesión no se envía ninguna mutación ni se pinta un favorito optimista.

Renderizar mediante el overlay compartido/CDK fuera de contenedores con blur o transform; no repetir el defecto del modal dentro del navbar. Foco inicial apropiado, trap de foco, Escape, restauración al disparador, fondo no interactivo, scroll bloqueado y contenido adaptable a pantallas bajas, tema oscuro y movimiento reducido. Cerrar no cambia la ruta.

Un libro físico agotado sigue indicando «Sin ejemplares disponibles» y no ofrece una reserva ejecutable. La modal no promete disponibilidad; después de autenticar se consulta el estado actual y un conflicto real conserva su mensaje específico.

## Sesión y retorno

- Mantener returnUrl interno, con filtros y paginación cuando corresponda, en navbar, modal, login y registro. Reutilizar y ampliar la validación existente; rechazar destinos externos y rutas que el rol no puede abrir.
- Desde una acción en una tarjeta, volver a la ficha de ese libro; desde el navbar, volver a la página pública actual con sus filtros.
- El registro continúa creando la cuenta y llevando al login; no introducir auto-login en esta entrega.
- Token vencido al pulsar: transición a visitante y modal de acceso. Un 401 real de sesión activa limpia el estado y solicita autenticación una sola vez. Las páginas privadas siguen redirigiendo; la navegación pública no debe quedar bloqueada por una sesión vencida.
- Un 403 por rol o cuenta inactiva no se trata como visitante: explicar falta de permiso y evitar un bucle de login. Errores de red/5xx tampoco se presentan como falta de sesión.
- Al salir desde una página pública, permanecer en ella como visitante. Al salir desde una privada, ir a Descubrir y limpiar el estado personal. Releer al volver impide confirmar acciones sobre inventario obsoleto.

## Criterios de aceptación

1. Sin token, `/` abre Descubrir; búsqueda, filtros, paginación, ficha, relacionados y recarga por enlace directo funcionan.
2. Navbar desktop/móvil muestra las dos acciones de acceso sin desbordamiento; cuenta autenticada conserva menú y accesos por rol.
3. GET públicos responden sin JWT, no exponen inactivos ni URL digital; endpoints privados siguen devolviendo 401/403 según corresponda.
4. Reservar físico/digital o guardar como visitante abre una única modal; cero escrituras y cero peticiones a endpoints personales.
5. Cancelar/Escape conserva ruta y restaura foco. Modal visible completa en claro/oscuro y cuatro tamaños, incluso con navbar sticky y página desplazada.
6. Login y registro conservan el destino permitido. El retorno no ejecuta ninguna mutación automáticamente y recarga disponibilidad.
7. Último ejemplar reservado por otra persona durante el login produce feedback de inventario correcto al confirmar.
8. Sesión expirada, credenciales incorrectas, rol sin permiso y fallo de red tienen comportamientos distintos, sin bucles ni modales duplicadas.
9. Logout/cambio de cuenta no conserva favoritos, reservas ni respuestas tardías de la identidad anterior.
10. Mi biblioteca, Favoritos, Perfil y módulos de personal permanecen protegidos al entrar por URL, navegación interna y volver atrás.

## Entrega

Implementar y probar primero las lecturas públicas de la API; después rutas/shell y estados de visitante; luego modal/retorno/limpieza de sesión; finalmente pruebas integradas de visitante y de los tres roles. Publicar API compatible antes del cliente. Sin migración de datos, nuevos roles ni cambios de permisos de préstamo en este alcance.

El diseño queda separado de las correcciones locales del modal de logout. No desplegar ni marcar cerrada la fase 5 por este documento. SEO/SSR, autenticación social y guardado anónimo para sincronizar después quedan fuera del alcance.
