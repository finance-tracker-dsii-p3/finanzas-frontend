# Guía de Despliegue Continuo (CI/CD)

Este proyecto está configurado con **Integración Continua (CI)** y **Despliegue Continuo (CD)** usando GitHub Actions y Vercel.

## 🚀 Configuración Inicial

### 1. Configurar Vercel

#### Opción A: Conectar repositorio en Vercel (Recomendado)

1. Ve a [vercel.com](https://vercel.com) e inicia sesión
2. Haz clic en "Add New Project"
3. Importa tu repositorio de GitHub
4. Vercel detectará automáticamente la configuración de `vercel.json`
5. Agrega las variables de entorno:
   - `VITE_API_BASE_URL`: URL de tu API backend

#### Opción B: Despliegue manual con Vercel CLI

```bash
npm i -g vercel
vercel login
vercel
```

### 2. Configurar Secrets en GitHub

Para que el workflow de CD funcione, necesitas agregar estos secrets en GitHub:

1. Ve a tu repositorio en GitHub
2. Settings → Secrets and variables → Actions
3. Agrega los siguientes secrets:

   - **`VERCEL_TOKEN`**: 
     - Obtén tu token en: [Vercel Settings → Tokens](https://vercel.com/account/tokens)
     - Crea un nuevo token con permisos completos
   
   - **`VERCEL_ORG_ID`** (Cuenta Personal o Organización):
     - **Para cuenta personal**: Es el ID de tu cuenta personal
     - **Para organización**: Es el ID de tu organización/equipo
     - **Cómo obtenerlo**:
       
       **Opción 1: Desde Vercel CLI (Recomendado)**
       ```bash
       npm i -g vercel
       vercel login
       vercel link  # Si no has vinculado el proyecto
       # O ejecuta:
       vercel inspect
       # Busca el campo "orgId" en la salida
       ```
       
       **Opción 2: Desde la Web**
       1. Ve a tu proyecto en Vercel
       2. Settings → General
       3. Busca "Team ID" (para organizaciones) o "Personal Account ID" (para cuentas personales)
       4. Copia ese ID
       
       **Opción 3: Desde el archivo .vercel/project.json**
       ```bash
       # Si ya tienes el proyecto vinculado localmente
       cat .vercel/project.json
       # Busca el campo "orgId"
       ```
   
   - **`VERCEL_PROJECT_ID`**:
     - Después de crear el proyecto en Vercel, lo encontrarás en:
     - Settings del proyecto → General → Project ID
     - O en el archivo `.vercel/project.json` (campo `projectId`)
   
   - **`VITE_API_BASE_URL`** (opcional):
     - URL de tu API backend para producción
     - Ejemplo: `https://api.tudominio.com`
   
   - **`VITE_API_BASE_URL_STAGING`** (opcional):
     - URL de tu API backend para staging/desarrollo
     - Si no se define, usará `VITE_API_BASE_URL`
     - Ejemplo: `https://api-staging.tudominio.com`

### 2.1. Método Alternativo: Obtener IDs desde Vercel CLI

Si prefieres obtener todos los IDs de una vez:

```bash
# 1. Instalar Vercel CLI
npm i -g vercel

# 2. Iniciar sesión
vercel login

# 3. Vincular el proyecto (si no está vinculado)
vercel link

# 4. Ver la información del proyecto
vercel inspect

# 5. O ver el archivo de configuración
cat .vercel/project.json
```

El archivo `.vercel/project.json` contiene:
```json
{
  "orgId": "tu-org-id-aqui",
  "projectId": "tu-project-id-aqui"
}
```

### 3. Configurar Variables de Entorno en Vercel

1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Agrega:
   - `VITE_API_BASE_URL`: URL de tu API en producción

## 📋 Workflows de GitHub Actions

### CI (Integración Continua)

**Archivo**: `.github/workflows/ci.yml`

Se ejecuta en:
- Push a `main`, `develop`, `master`
- Pull Requests a estas ramas

Tareas:
- ✅ Linting con ESLint
- ✅ Verificación de tipos TypeScript
- ✅ Build del proyecto
- ✅ Auditoría de seguridad npm

### CD (Despliegue Continuo)

**Archivo**: `.github/workflows/cd.yml`

Se ejecuta en:
- Push a `main`, `develop` o `master`
- Pull Requests hacia `develop`
- Manualmente desde GitHub Actions

Tareas:
- ✅ Build del proyecto
- ✅ Despliegue automático en Vercel:
  - **Producción**: Push a `main` o `master` → Despliega en producción (`--prod`)
  - **Staging/Preview**: 
    - Push a `develop` → Despliega como preview deployment
    - Pull Request hacia `develop` → Despliega como preview deployment (permite probar cambios antes del merge)

### Deploy Preview

**Archivo**: `.github/workflows/deploy-preview.yml`

Se ejecuta en:
- Pull Requests a `main`, `develop`, `master`

Tareas:
- ✅ Build del proyecto
- ✅ Comentario en el PR con el estado del build

**Nota**: Los Pull Requests hacia `develop` también activan el workflow de CD que despliega automáticamente en Vercel, además de este workflow de preview.

## 🔄 Flujo de Trabajo

### Desarrollo Normal

1. **Crear una rama**:
   ```bash
   git checkout -b feature/nueva-funcionalidad
   ```

2. **Hacer cambios y commit**:
   ```bash
   git add .
   git commit -m "feat: nueva funcionalidad"
   git push origin feature/nueva-funcionalidad
   ```

3. **Crear Pull Request hacia develop**:
   - El CI se ejecutará automáticamente
   - El CD se ejecutará automáticamente y desplegará un preview en Vercel
   - Vercel también creará un preview del PR automáticamente (si está conectado)
   - Esto permite probar los cambios antes de hacer merge

4. **Merge a develop**:
   - El CD se ejecutará automáticamente
   - Se desplegará en staging/preview en Vercel

5. **Merge a main**:
   - El CD se ejecutará automáticamente
   - Se desplegará en producción en Vercel

## 📝 Nota sobre Cuentas Personales vs Organizaciones

### Cuenta Personal de Vercel

Si usas una cuenta personal (no una organización):

- El `VERCEL_ORG_ID` es el ID de tu cuenta personal
- Funciona exactamente igual que con organizaciones
- Los workflows están configurados para funcionar con ambos tipos

### Verificar tu tipo de cuenta

1. Ve a [vercel.com/account](https://vercel.com/account)
2. Si ves "Personal Account" → Es cuenta personal
3. Si ves "Teams" o "Organizations" → Es organización

Ambos funcionan con la misma configuración.

### Despliegue Manual

Si necesitas desplegar manualmente:

```bash
# Build local
npm run build

# Desplegar en Vercel
vercel --prod
```

## 🛠️ Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Inicia servidor de desarrollo

# Build
npm run build            # Build para producción

# Calidad de código
npm run lint             # Ejecutar ESLint
npm run lint:fix         # Corregir errores de ESLint
npm run type-check       # Verificar tipos TypeScript
npm run format           # Formatear código con Prettier
npm run format:check     # Verificar formato

# Preview
npm run preview          # Preview del build local
```

## 🌍 Entornos

### Desarrollo
- **URL**: `http://localhost:5173` (o el puerto que Vite asigne)
- **API**: Configurada en `.env.local` o `vite.config.ts`

### Staging/Preview
- **URL**: 
  - Generada automáticamente por Vercel para cada PR
  - También se despliega automáticamente cuando hay push a `develop`
  - También se despliega automáticamente cuando hay Pull Request hacia `develop` (permite probar cambios antes del merge)
- **API**: Usa `VITE_API_BASE_URL_STAGING` (si está definido) o `VITE_API_BASE_URL` del secret de GitHub

### Producción
- **URL**: Tu dominio en Vercel (ej: `https://finanzas-frontend.vercel.app`)
- **API**: Usa `VITE_API_BASE_URL` configurada en Vercel

## 🔍 Monitoreo

### Verificar el estado de los workflows

1. Ve a tu repositorio en GitHub
2. Pestaña "Actions"
3. Verás el historial de todos los workflows ejecutados

### Ver logs de despliegue en Vercel

1. Ve a tu proyecto en Vercel
2. Pestaña "Deployments"
3. Verás el historial de despliegues con logs detallados

## 🐛 Solución de Problemas

### El workflow falla en el build

1. Verifica que todas las dependencias estén en `package.json`
2. Revisa los logs en GitHub Actions
3. Prueba el build localmente: `npm run build`

### El despliegue en Vercel falla

1. Verifica que los secrets estén configurados correctamente
2. Revisa las variables de entorno en Vercel
3. Verifica que `vercel.json` esté correctamente configurado

### Variables de entorno no funcionan

- Las variables deben empezar con `VITE_` para ser accesibles en el frontend
- Reinicia el despliegue después de agregar nuevas variables

## 📚 Recursos Adicionales

- [Documentación de Vercel](https://vercel.com/docs)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)

## 🔐 Seguridad

- ⚠️ **NUNCA** commitees archivos `.env` con credenciales
- ⚠️ Usa GitHub Secrets para información sensible
- ⚠️ Usa Variables de Entorno en Vercel para configuración de producción
- ⚠️ Revisa regularmente las auditorías de seguridad: `npm audit`

