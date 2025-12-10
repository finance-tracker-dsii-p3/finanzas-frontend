## Evidencias de Implementación vs. Requisitos del Proyecto

### 1. Propósito y producto
- **Producto:** Frontend de finanzas personales (`React + Vite + TypeScript + TailwindCSS`), conectado a backend REST.
- **Módulos clave:** autenticación (registro/login), cuentas, categorías, movimientos, alertas, presupuestos, reportes/analytics, metas, reglas, perfil y dashboard.
- **Estado:** Aplicación funcional con build exitoso y pruebas automatizadas que cubren flujos centrales.

### 2. Alcance funcional mínimo
- **Autenticación y gestión de usuario:** pantallas de registro, login, perfil y rutas protegidas (`ProtectedRoute`).
- **Transacciones del dominio:** creación/edición/eliminación de movimientos, cuentas, presupuestos, metas y reglas; cálculo de totales y validaciones (ej. IVA, GMF, presupuestos).
- **Requisitos no funcionales cubiertos:** tipado estricto (`strict` en TS), linting obligatorio, build reproducible (`npm ci`, `.nvmrc`), y manejo básico de errores en servicios.

### 3. Arquitectura y diseño
- **Stack y estructura:** SPA con rutas (React Router), contexts para estado global (auth, alertas, categorías, divisas, movimientos), servicios tipados para llamadas HTTP y utilidades para moneda/cookies.
- **Configuración de build:** `vite.config.ts` con code-splitting por vendors; `tsconfig` con `moduleResolution: bundler`.
- **Diseño/UX:** mockups y guías de pruebas manuales documentadas en `GUIA_PRUEBAS_MANUALES.md`.
- **Deploy target:** `vercel.json` (SPA con rewrites a `index.html`), artifacts en `dist/`.

### 4. Gestión ágil (Scrum)
- **Backlog y épicas/HU:** Organizado en la herramienta de gestión (referenciado externamente) con HU por módulo (auth, cuentas, movimientos, presupuestos, etc.).
- **DoR/DoD y estimación:** Definidos por HU en la herramienta (planning poker). Evidencias de ceremonias y métricas se mantienen en el espacio de documentación (Confluence/Jira).
- **Trazabilidad:** HU → PR → pipelines CI → despliegue preview en Vercel.

### 5. DevOps (CI/CD)
- **Políticas y estándares:**
  - Linter (`eslint`) obligatorio en CI (`npm run lint`).
  - Tipado estricto (`npm run type-check`).
  - Formato con Prettier (chequeo y fix).
  - Ramas: flujo `main/develop/feature-*` (según workflows).
  - Dependencias reproducibles con `npm ci` y lockfile.
- **CI (GitHub Actions):**
  - Workflow `ci.yml`: lint + type-check + tests (`vitest run`) + build con `VITE_API_BASE_URL` inyectable por secret; artifact `dist` generado.
  - Cobertura: `vitest --coverage` con umbral configurado en `vitest.config.ts` (20% mínimo; reportes text/json/html/lcov).
- **CD (Vercel):**
  - Workflows `cd.yml`/`deploy-preview.yml`: despliegue automático a Vercel (preview para PR/develop, prod para main/master) usando `amondnet/vercel-action@v25`.
  - Gestión de secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `VITE_API_BASE_URL` (y staging).
  - `.nvmrc` y `engines` en `package.json` aseguran Node 20; `vercel.json` sin propiedades inválidas.
- **Seguridad y dependencias:**
  - `npm audit` en workflow de seguridad.
  - Secrets fuera del código (uso de variables y secrets en Actions/Vercel).

### 6. Pruebas y calidad
- **Automatizadas (Vitest + RTL):** 258 pruebas pasando en CI; módulos cubiertos: login/register, movimientos, cuentas, categorías, modales (confirmación, detalle, nuevas entidades), servicios (auth, account, transaction, alert, category, exchangeRate), utils (currency, cookies, errores), App/main.
- **Cobertura:** Reporte generado con V8; umbral operativo 20% mientras se incrementa cobertura progresivamente.
- **Pruebas manuales:** `GUIA_PRUEBAS_MANUALES.md` con casos detallados por módulo.

### 7. Documentación
- **Repositorio:** `README.md` con guía de instalación, variables `VITE_*`, scripts y ejecución local.
- **Guías específicas:** `DEPLOYMENT.md` (pasos de despliegue y troubleshooting), `COVERAGE_ANALYSIS.md` (estrategia para aumentar cobertura), `GUIA_PRUEBAS_MANUALES.md` (plan de QA manual).
- **Runbook CI/CD:** Workflows en `.github/workflows` describen pasos, entornos, variables y artifacts.

### 8. Evidencias de cumplimiento con rubrica
- **CI en cada push/PR:** activo con build + pruebas.
- **CD:** despliegue automático a Vercel (preview/prod) con artifacts reproducibles.
- **Calidad de código:** linters, tipado estricto, formateo y separación de vendors en build.
- **Funcionalidad clave:** autenticación, transacciones del dominio financiero, gestión de entidades y rutas protegidas.
- **Documentación viva:** guías de despliegue, cobertura y pruebas manuales en repo; backlog y ceremonias registrados en la herramienta de gestión.

### 9. Próximos pasos sugeridos
- Incrementar cobertura hacia el umbral recomendado (70–80%) priorizando servicios y componentes sin tests.
- Añadir monitoreo/observabilidad ligera en frontend (logging estructurado) y chequeos de accesibilidad básicos.
- Mantener auditoría de dependencias (Dependabot/OSV) y revisar políticas de ramas/PR con checklist de calidad.
- Publicar enlaces finales de Confluence/Jira y dashboards de métricas (burndown/velocidad) en la documentación central.

