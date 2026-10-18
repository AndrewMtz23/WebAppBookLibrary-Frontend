# Circulación — fase 10

La ficha consulta la política del servidor. En modo activo ofrece **Reservar para recoger** o **Entrar en lista de espera**. Para un lector autenticado consulta primero su estado por libro; recarga y una segunda pestaña muestran la reserva/espera existente. La confirmación explica las 48 horas de recogida y los 14 días desde entrega. Favoritos sigue siendo independiente.

Mi biblioteca muestra espera, recogidas con fecha/hora y zona local, renovaciones con decisión/motivo y préstamos. Una devolución física de la nueva política se registra por personal; el lector no puede liberarla desde un botón antiguo.

Personal dispone de `/admin/circulation` y `/librarian/circulation`: búsqueda por título/lector, listas paginadas, confirmación de entrega y aprobación/rechazo de renovación. Las acciones usan la versión del registro. Un conflicto vuelve a consultar sin perder los filtros. Los modales conservan foco y requieren motivo al rechazar.

Dashboards incluyen contadores actuales separados de espera, recogidas, préstamos entregados con nueva política y renovaciones pendientes. Las métricas históricas anteriores conservan sus etiquetas. `/help` y `/loan-guide` explican los plazos del modo activo; drenado informa la pausa.

## Pruebas

```powershell
npm test -- --code-coverage
npm run test:reduced-motion
npm run build -- --configuration production
npm run test:e2e -- e2e/circulation.spec.ts
```

Navegador usa el QaHost aislado en 7184, Angular en 4284 y `proxy.e2e.json`. La suite de circulación requiere QaHost nuevo con `Circulation__Mode=active`; la regresión anterior se ejecuta en modo `legacy`. No apuntar las pruebas a cuentas o datos reales.

## Dependencias y límites de cierre

Actualización del 18/10/2026: Angular 20.3.34 y CLI/build 20.3.40. Se sustituyeron Webpack/Karma por esbuild/Vite y Jasmine/Playwright; se retiraron los overrides antiguos y la dependencia `braces`. Auditoría completa npm: cero vulnerabilidades conocidas. [Comandos y arquitectura de pruebas](./testing.md).

El pendiente de auditoría registrado el 03/10 queda sustituido por esta migración; no se aplicaron excepciones ni `npm audit fix --force`. La activación de circulación sobre datos reales conserva sus requisitos de respaldo, conciliación y autorización de despliegue.
