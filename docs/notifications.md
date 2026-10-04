# Centro de notificaciones (fase 9)

Ruta `/app/notifications` para user, librarian y admin. Campana en navegación de escritorio y móvil, contador del servidor con representación `99+`, y nombre accesible completo. El refresco periódico es de 60 segundos en pestañas visibles, además de al recuperar foco y abrir el centro. Un fallo de conteo se presenta como desconocido, nunca como cero confirmado.

El centro muestra avisos persistentes, filtros todas/sin leer/leídas, paginación por cursor, fecha en zona local explícita, lectura individual y lectura global hasta la frontera recibida al cargar. No marca automáticamente al abrir un enlace. El destino únicamente permite fichas internas con ObjectId válido; la ficha maneja eliminación y acceso. Los avisos no contienen enlaces al archivo digital.

Las preferencias separan recordatorios en la aplicación y entrega opcional por correo; una dirección sin verificar no permite activar email. Las confirmaciones permanecen visibles y los mensajes de recuperación/verificación no se deshabilitan. Tras cambiar correo, el control deshabilitado queda apagado y permite seguir desactivando recordatorios.

El estado cancela solicitudes al cambiar identidad y borra lista, preferencias y contador. Una página abierta recarga ambos recursos para la nueva identidad. Las cargas tardías quedan canceladas; las mutaciones se confirman solo después de la respuesta. Si una marca pierde su respuesta se puede consultar y repetir por ser idempotente. El reintento conserva la página/filtro que falló.

Validación: `npm test -- --watch=false --browsers=ChromeHeadless`; `npm run build -- --configuration production`; `npm run test:e2e`. E2E requiere el QA host aislado del backend y Mongo local. `e2e/notifications.spec.ts` cubre 22 avisos, más de una página, un aviso que llega entre carga y lectura global, dos pestañas, preferencias, error/reintento, enlace y axe en claro/oscuro a 360/768/1366 px.

Desplegar primero el backend compatible indicado en `.github/workflows/e2e.yml`. El proveedor de correo real y colector de métricas requieren configuración y validación de staging; el buzón local de pruebas no equivale a entrega real.
