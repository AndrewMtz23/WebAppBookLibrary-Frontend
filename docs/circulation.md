# Circulación — fase 10

La ficha consulta la política del servidor. En modo activo ofrece **Reservar para recoger** o **Entrar en lista de espera**. Para un lector autenticado consulta primero su estado por libro; recarga y una segunda pestaña muestran la reserva/espera existente. La confirmación explica las 48 horas de recogida y los 14 días desde entrega. Favoritos sigue siendo independiente.

Mi biblioteca muestra espera, recogidas con fecha/hora y zona local, renovaciones con decisión/motivo y préstamos. Una devolución física de la nueva política se registra por personal; el lector no puede liberarla desde un botón antiguo.

Personal dispone de `/admin/circulation` y `/librarian/circulation`: búsqueda por título/lector, listas paginadas, confirmación de entrega y aprobación/rechazo de renovación. Las acciones usan la versión del registro. Un conflicto vuelve a consultar sin perder los filtros. Los modales conservan foco y requieren motivo al rechazar.

Dashboards incluyen contadores actuales separados de espera, recogidas, préstamos entregados con nueva política y renovaciones pendientes. Las métricas históricas anteriores conservan sus etiquetas. `/help` y `/loan-guide` explican los plazos del modo activo; drenado informa la pausa.

## Pruebas

```powershell
npm test -- --watch=false --browsers=ChromeHeadless --reporters=dots
npm run test:reduced-motion
npm run build -- --configuration production
npm run test:e2e -- e2e/circulation.spec.ts
```

Navegador usa el QaHost aislado en 7184, Angular en 4284 y `proxy.e2e.json`. La suite de circulación requiere QaHost nuevo con `Circulation__Mode=active`; la regresión anterior se ejecuta en modo `legacy`. No apuntar las pruebas a cuentas o datos reales.

## Dependencias y límites de cierre

Actualización de parches: Angular 20.3.33, CLI/build 20.3.37. Overrides acotados para `piscina >=5.3.2`, `webpack-dev-middleware >=7.4.6` y `uuid >=11.1.1` bajo `sockjs`. Verificados con instalación normal, suites y build; no se cambia de versión mayor de Angular.

Auditoría del 03/10/2026: dependencias de producción sin avisos. La auditoría completa conserva dos avisos sin versión corregida publicada (`braces <=3.0.3`, `http-cache-semantics <=4.2.0`), propagados a 21 dependencias de desarrollo. No usar `npm audit fix --force` para degradar Angular/Karma. Repetir auditoría e instalar los parches cuando se publiquen; el criterio de cero vulnerabilidades totales permanece pendiente.
