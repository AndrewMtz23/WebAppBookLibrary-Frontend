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

## Cierre para uso real (28/09/2026)

`AuthService` escucha cambios de sesión entre pestañas del mismo origen. Lee el valor actual de localStorage para ignorar eventos atrasados, valida su forma/vencimiento y cancela datos personales al cambiar identidad/token/rol o cerrar sesión. No reescribe el storage al recibir el evento. Cambios de perfil de la misma identidad actualizan la presentación sin reiniciar solicitudes. La suscripción se retira al destruir el servicio.

Las peticiones de lectura tienen un límite de 20 segundos. Un fallo de transporte, timeout o 5xx puede ocurrir después de guardar: se conserva el borrador, se informa que el resultado es desconocido y se bloquean nuevos envíos. El usuario puede recargar explícitamente para consultar el servidor y descartar el borrador. La apertura de otra tarjeta no elimina el bloqueo; solo una recarga exitosa lo resuelve. No se reenvía automáticamente una mutación incierta.

Pruebas adicionales: dos pestañas del mismo BrowserContext con logout/login y respuesta pendiente; PUT confirmado en backend cuya respuesta se corta; timeout; sincronización sin bucles y rechazo de datos de sesión inválidos. Suite unitaria: 263/263. Los 10 recorridos de lectura pasan. La suite completa de navegador y los checks remotos se registran en el PR.

La revisión independiente detectó el desbloqueo al reabrir la tarjeta, reproducido y corregido. La suite completa detectó además un `aria-label` sobre un div de categorías sin rol: se le asignó `role=group`, manteniendo las comprobaciones axe.

El workflow integrado fija un SHA compatible del backend de fase 8. Desplegar primero API/índices, después cliente; mantener artefactos compatibles para rollback. Las puertas de staging, respaldo real, collector/alertas y aceptación humana con lector de pantalla/zoom real al 200 % siguen requiriendo el entorno de puesta en operación. No se declaran cubiertas por las pruebas locales.
