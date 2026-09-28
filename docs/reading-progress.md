# Mis lecturas — fase 8

`/app/reading` ofrece Quiero leer, Leyendo y Terminados a las tres clases de cuenta. La ficha incluye «Mi lectura»; un invitado recibe el diálogo de acceso existente. Favoritos y reservas conservan sus flujos propios.

El editor permite porcentaje o página actual, reiniciar, reabrir y quitar seguimiento con confirmación. Un cambio del total del catálogo muestra el snapshot conservado y exige adopción explícita. La respuesta de lectura proporciona el total actual, incluso cuando ya no existe; no se utiliza una ficha antigua para reconciliarlo.

## Estado y errores

- `ReadingService`: DTOs y rutas `/api/reading/my`.
- `ReadingFacade`: estado por componente, cancelación y limpieza al cambiar sesión; sin progreso en localStorage.
- Guardado confirmado por servidor: errores conservan borrador y progreso anterior.
- Un 409 conserva el borrador y ofrece «Recargar y descartar borrador». No hay reintento automático que sobrescriba otro dispositivo.
- Pestañas con flechas/Home/End, inputs etiquetados, foco en errores y retorno al cerrar editor.
- Libros no disponibles muestran fallback y permiten quitar seguimiento.

Perfil reutiliza `ReadingFacade` y muestra estados propios de carga/error/vacío. Discover consulta la última lectura activa persistida; el banner permanece en ella mientras cambia el carrusel de recomendaciones. Se retiró el 64 % ficticio. El enlace lleva a la ficha y no concede acceso al archivo.

## Verificación

```text
npm test -- --watch=false --browsers=ChromeHeadless --reporters=dots
npm run test:reduced-motion
npm run build -- --configuration production
```

259 pruebas unitarias y 2 de movimiento reducido. Build producción `967c138579c04982`.

Para navegador, iniciar el host aislado `tools/BookLibrary.QaHost` del backend con su Mongo local en 27184 y Angular en 4284 usando `proxy.e2e.json`. Los recorridos comprueban el marcador `/__qa` antes de crear cuentas sintéticas. No ejecutar contra una base compartida.

```text
npx playwright test e2e/reading-progress.spec.ts e2e/account-recovery.spec.ts e2e/profile.spec.ts e2e/public-discovery.spec.ts e2e/email-login.spec.ts e2e/password-security.spec.ts --reporter=list
```

Lectura cubre tres roles, invitado, persistencia, conflictos entre dispositivos, aislamiento, fallo de guardado, reconciliación y préstamos/favoritos intactos. Accesibilidad automatizada con axe y comprobaciones de teclado/foco en claro/oscuro y 360/768/1366/1920 px.

Rollback: revertir el cliente junto con backend; conservar la colección de seguimiento para restauración posterior. La entrega permanece en `feat/phase-8-reading-progress`; publicación y despliegue son pasos separados.
