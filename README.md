# Proyecto Finanzas Frontend

Aplicación web para la gestión de finanzas personales, con módulos de autenticación, presupuestos, movimientos y reportes.  
Este repositorio corresponde al **Frontend** del proyecto *Finance Tracker* del curso **Desarrollo de Software II (Proyecto #3)**.

---

## Stack Tecnológico

**Frontend:** React, Vite, TypeScript, TailwindCSS, React Router  
**Backend:** Django REST Framework
**Base de Datos:** PostgreSQL  
**Despliegue:** Vercel (frontend) y Render (backend)
**Testing:** Vitest, React Testing Library

---

## Configuración del Entorno Local

### Prerrequisitos

Antes de iniciar, asegúrate de tener instalado:

- [Node.js](https://nodejs.org/) (versión **18 o superior**)  
- [npm](https://www.npmjs.com/) (versión **9 o superior**)  
- [Git](https://git-scm.com/)

---

## Inicialización

Ejecuta los siguientes comandos en tu terminal:

```bash
# Clonar el repositorio
git clone https://github.com/finance-tracker-dsii-p3/finanzas-frontend.git

# Entrar al proyecto
cd finanzas-frontend

# Cambiar a la rama de desarrollo
git checkout develop

# Instalar dependencias
npm install
```

### Configuración de Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```bash
# URL del backend API
VITE_API_BASE_URL=http://localhost:8000
```

**Nota:** Si no defines `VITE_API_BASE_URL`, por defecto usará `http://localhost:8000`.

---

## Ejecución del Proyecto

### Modo desarrollo

```bash
npm run dev
```

Abre el navegador en 👉 [http://localhost:5173](http://localhost:5173)

### Build de producción

```bash
npm run build
```

Esto generará los archivos optimizados en la carpeta `dist/`.

### Previsualizar la build localmente

```bash
npm run preview
```

---

## Testing

### Ejecutar tests

```bash
# Ejecutar tests en modo watch
npm run test

# Ejecutar tests una vez
npm run test:run

# Ejecutar tests con UI
npm run test:ui

# Ejecutar tests con cobertura
npm run test:coverage
```

### Estructura de tests

Los tests están organizados junto a los componentes:

```
src/
  pages/
    login/
      Login.tsx
      Login.test.tsx
    register/
      Register.tsx
      Register.test.tsx
```

---

## Estructura del Proyecto

```
src/
 ├─ components/        → Componentes reutilizables (Navbar, botones, inputs)
 ├─ context/           → Contextos globales (autenticación, usuario)
 ├─ layouts/           → Plantillas y estructura de vistas
 ├─ pages/             → Páginas principales (Login, Register, Home, etc.)
 ├─ services/          → Comunicación con la API
 ├─ test/              → Utilidades y configuración de tests
 ├─ types/             → Interfaces y tipos TypeScript
 ├─ utils/             → Funciones auxiliares y helpers
 ├─ App.tsx            → Rutas principales y layout base
 ├─ main.tsx           → Punto de entrada de la aplicación
 └─ index.css          → Estilos globales + configuración de TailwindCSS
```

---

## Flujo de Trabajo del Equipo

1. **Crear una nueva rama** a partir de `develop`:
   ```bash
   git switch -c feature/HU-01-login-usuario
   ```

2. **Implementar la funcionalidad** (por ejemplo: página de registro o login).  
3. **Probar localmente** ejecutando `npm run dev`.  
4. **Ejecutar tests** antes de hacer commit:
   ```bash
   npm run test:run
   ```
5. **Hacer commit y push**:
   ```bash
   git add .
   git commit -m "HU-01: Implementar pantalla de login"
   git push origin feature/HU-01-login-usuario
   ```
6. **Crear un Pull Request** para fusionar con `develop`.

---

## Equipo de Desarrollo

| Rol | Nombre |
|------|---------|
| Product Owner | Mauricio Teherán |
| Scrum Master / Líder Frontend | Hernán García |
| Frontend Dev | Julieta Arteta |
| Backend Devs | David Reyes, Juan Camilo Jiménez |

---

## Comandos Útiles

| Comando | Descripción |
|----------|--------------|
| `npm run dev` | Ejecuta el proyecto en modo desarrollo |
| `npm run build` | Genera build de producción |
| `npm run preview` | Previsualiza la build |
| `npm run lint` | Ejecuta ESLint para verificar el código |
| `npm run lint:fix` | Corrige errores de ESLint automáticamente |
| `npm run type-check` | Verifica tipos TypeScript |
| `npm run format` | Formatea el código con Prettier |
| `npm run format:check` | Verifica el formato del código |
| `npm run test` | Ejecuta tests en modo watch |
| `npm run test:run` | Ejecuta tests una vez |
| `npm run test:coverage` | Ejecuta tests con reporte de cobertura |

---

## 🚀 CI/CD (Integración y Despliegue Continuo)

Este proyecto está configurado con **CI/CD automatizado** usando GitHub Actions y Vercel.

### ✅ Integración Continua (CI)

Cada vez que haces push o creas un Pull Request, se ejecutan automáticamente:

- ✅ **Linting** con ESLint
- ✅ **Verificación de tipos** TypeScript
- ✅ **Tests automatizados** (Login, Register, etc.)
- ✅ **Build del proyecto**
- ✅ **Auditoría de seguridad** npm

### 🚢 Despliegue Continuo (CD)

- **Producción**: Se despliega automáticamente en Vercel cuando haces merge a `main` o `master`
- **Preview**: Cada Pull Request genera un preview automático en Vercel

### 📚 Documentación Completa

Para más detalles sobre la configuración de CI/CD, consulta el archivo **[DEPLOYMENT.md](./DEPLOYMENT.md)**

### Configuración Rápida

1. **Conecta tu repositorio en Vercel**: [vercel.com](https://vercel.com)
2. **Configura los secrets en GitHub**:
   - Ve a Settings → Secrets and variables → Actions
   - Agrega: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
3. **¡Listo!** Cada push a `main` desplegará automáticamente

---

Una vez completes los pasos anteriores, podrás ver la aplicación ejecutándose en tu entorno local.
