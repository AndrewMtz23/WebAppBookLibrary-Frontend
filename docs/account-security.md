# Seguridad de cuentas — fase 7

27/09/2026. Trabajo local desde `C:\Proyectos\BookLibrary`. Login recibe `{email,password}`; username conserva su papel de identidad. No se hizo push durante esta reanudación.

## Rutas y comportamiento

- `/auth/forgot-password`: misma respuesta para correos conocidos/desconocidos. El éxito confirma recepción de solicitud, no entrega de correo.
- `/auth/reset-password`: captura token de `#token=...`, retira fragmento de la barra y exige contraseña/confirmación antes del POST. No inicia sesión automáticamente.
- `/auth/verify-email`: captura y retira fragmento, requiere botón de confirmación. Abrir el enlace no consume el reto.
- `/app/profile`: estado real `emailVerifiedAt`, solicitud de verificación, enfriamiento y cambio autenticado de contraseña. Actualizar correo limpia la verificación en backend.
- Interceptor omite sesiones anteriores en login/registro, solicitud/confirmación de recuperación y confirmación de correo. La solicitud autenticada de verificación conserva autorización.
- Errores 429 explican espera; 0/5xx indisponibilidad temporal con reintento; enlace inválido/vencido/usado muestra alternativa para solicitar otro. Resumen de errores recibe foco y se asocia con campos.

Los valores visibles de vigencia son los defaults backend: recuperación 30 minutos y verificación 24 horas. Cambiar configuración exige actualizar esos textos. No se guardan tokens de recuperación en almacenamiento; permanecen en memoria hasta completar/salir. Recargar tras retirar fragmento requiere reabrir el enlace original.

## QA y verificación

Solo host QA loopback 7184 y Angular 4284 con `proxy.e2e.json`, Mongo 27184 replica set `booklibraryqa`, cuentas sintéticas `.invalid`. Comprobar `/__qa` antes de mutaciones. `/__qa/mail` es buzón de prueba exclusivo de ese host; no existe proveedor externo.

```powershell
npm test -- --watch=false --browsers=ChromeHeadless --reporters=dots
npm run build -- --configuration production
npm run test:reduced-motion
npx playwright test e2e/account-recovery.spec.ts e2e/email-login.spec.ts e2e/password-security.spec.ts e2e/profile.spec.ts e2e/public-discovery.spec.ts
```

Suite unitaria: 248 pruebas. Movimiento reducido: 2. Navegador cubre contratos genéricos, consumo explícito/único, revocación, nuevo login, perfil, verificación y navegación pública; tres roles, 360/768/1366/1920 px, temas claro/oscuro, axe y contraste del título lateral. La inspección visual detectó y corrigió título invisible en tema claro; el test de contraste falló antes de la corrección.

Evidencia global: `Docs/sprints/sprint1/evidencias/fase-7-verificacion.md` fuera de los dos repositorios. El runbook backend `docs/account-security.md` documenta cola, lease, reintentos, deduplicación, claves, configuración y rollback. La entrega externa requiere proveedor/remitente/dominio autorizados y claves persistentes del entorno; no se habilita por pasar QA local.
