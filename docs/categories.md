# Categorías controladas — fase 6

`/admin/categories` utiliza el shell y encabezado compartidos. Admin puede buscar, crear, editar, activar/desactivar y eliminar categorías sin uso. El bibliotecario puede seleccionarlas al crear/editar libros; no recibe navegación ni permisos administrativos sobre el vocabulario.

El editor ofrece búsqueda paginada, chips de selección y límite de ocho. Las categorías inactivas previamente asignadas permanecen identificadas. Escribir texto en la búsqueda no crea categorías. Los errores de guardado conservan el borrador. Un conflicto de versión requiere revisar la categoría actual antes de repetir la edición.

El catálogo público usa IDs de facetas, manteniendo URLs `genre` anteriores. El contrato de escritura de libros envía `categoryIds`; las respuestas conservan `genres` para presentación y clientes anteriores.

**Despliegue:** migrar y conciliar el vocabulario del backend antes de habilitar el editor nuevo sobre datos anteriores. Sin categorías, el selector informa estado vacío y no permite guardar una clasificación inventada. Consultar `docs/categories.md` del repositorio backend para dry-run, mapping, aplicación y rollback.

Validación:

```powershell
npm test -- --watch=false --browsers=ChromeHeadless
npm run build -- --configuration production
npx playwright test e2e/categories.spec.ts e2e/release-journeys.spec.ts
```

Playwright requiere únicamente el host QA aislado en 7184 y Angular en 4284 con `proxy.e2e.json`; verifica el prefijo de la base antes de mutar. La suite de categorías cubre CRUD/duplicados, conservación de borrador, retorno de foco, asignación desde bibliotecario y consulta pública. Incluye 360/768/1366/1920 px, claro/oscuro, Escape y axe sobre las modales. Capturas/trazas se generan en `test-results/`, ignorado por Git.
