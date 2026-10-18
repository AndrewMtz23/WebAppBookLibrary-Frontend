# Compilación y pruebas

Angular 20 utiliza `@angular/build:application` (esbuild) y el servidor de desarrollo Vite. `npm run build -- --configuration production` conserva la salida `dist/digital-library-client`, los recursos de `public`, estilos globales y sustitución del entorno de producción. Los proxies usan `/api/**` y `/__qa/**` para cubrir rutas anidadas en Vite.

## Pruebas unitarias en navegador

`npm test` descubre todos los `src/**/*.spec.ts`, compila una entrada temporal con Angular y ejecuta Jasmine/Zone.js en Chrome mediante Playwright. No depende de Karma ni Webpack. Se mantienen los helpers de TestBed, spies de Jasmine y `fakeAsync` existentes.

- `npm test -- --code-coverage`: cobertura V8 con source maps convertida a Istanbul en `coverage/digital-library-client`.
- `npm run test:reduced-motion`: las dos comprobaciones CSS con preferencia de movimiento reducido real en Chrome.
- `npm run test:runner`: comprueba propagación de fallos, omisiones y suites vacías.
- `npm run test:e2e`: recorridos integrados con QaHost aislado y frontend en 4284; ver `docs/circulation.md` y `.github/workflows/e2e.yml`.
- `npm audit`: auditoría de todas las dependencias, incluidas herramientas de desarrollo; también es obligatoria en CI.

Se usa Chrome instalado por defecto. En CI, `E2E_CHROME_CHANNEL=chromium` utiliza el navegador instalado mediante `npx playwright install --with-deps chromium`. El servidor de pruebas escucha exclusivamente en loopback y se cierra al terminar. Resultados Jasmine: `test-results/jasmine.json` y `jasmine-reduced-motion.json`.

El comando unitario ejecuta una pasada completa y falla si hay errores de build, de navegador, de specs, pruebas pendientes/omitidas o cero pruebas. No ofrece modo watch; se vuelve a ejecutar tras modificar código. Los archivos generados quedan en `.angular/browser-tests` y `dist/browser-tests`, ignorados por Git. No ejecutar las dos variantes unitarias simultáneamente porque comparten esta salida.
