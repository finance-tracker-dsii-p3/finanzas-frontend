# 🔑 Guía Rápida: Obtener IDs de Vercel

Esta guía te ayudará a obtener los IDs necesarios para configurar CI/CD, ya sea que uses una **cuenta personal** o una **organización**.

## Método 1: Usando Vercel CLI (Más Fácil) ⭐

### Paso 1: Instalar Vercel CLI

```bash
npm install -g vercel
```

### Paso 2: Iniciar sesión

```bash
vercel login
```

Esto abrirá tu navegador para autenticarte.

### Paso 3: Vincular tu proyecto (si no está vinculado)

```bash
cd /ruta/a/tu/proyecto
vercel link
```

Te preguntará:
- **Set up and deploy?** → Selecciona el proyecto existente o crea uno nuevo
- **Which scope?** → Selecciona tu cuenta personal o tu organización

### Paso 4: Ver los IDs

Después de vincular, se creará un archivo `.vercel/project.json`:

```bash
cat .vercel/project.json
```

Verás algo como:
```json
{
  "orgId": "team_xxxxxxxxxxxxx",
  "projectId": "prj_xxxxxxxxxxxxx"
}
```

- **`orgId`** → Este es tu `VERCEL_ORG_ID` (funciona para cuentas personales y organizaciones)
- **`projectId`** → Este es tu `VERCEL_PROJECT_ID`

### Paso 5: Obtener el Token

1. Ve a: https://vercel.com/account/tokens
2. Haz clic en "Create Token"
3. Dale un nombre (ej: "GitHub Actions")
4. Copia el token generado → Este es tu `VERCEL_TOKEN`

---

## Método 2: Desde la Web de Vercel

### Obtener VERCEL_ORG_ID

1. Ve a tu proyecto en Vercel
2. Settings → General
3. Busca:
   - **"Team ID"** (si es organización)
   - **"Personal Account ID"** (si es cuenta personal)
4. Copia ese ID

### Obtener VERCEL_PROJECT_ID

1. En el mismo lugar (Settings → General)
2. Busca **"Project ID"**
3. Copia ese ID

### Obtener VERCEL_TOKEN

1. Ve a: https://vercel.com/account/tokens
2. Create Token
3. Copia el token

---

## Método 3: Usando vercel inspect

```bash
# Si ya tienes el proyecto vinculado
vercel inspect

# Esto mostrará información detallada incluyendo:
# - orgId
# - projectId
# - etc.
```

---

## 📋 Resumen de IDs Necesarios

| Secret | Descripción | Dónde encontrarlo |
|--------|-------------|-------------------|
| `VERCEL_TOKEN` | Token de autenticación | https://vercel.com/account/tokens |
| `VERCEL_ORG_ID` | ID de cuenta/organización | `.vercel/project.json` o Settings → General |
| `VERCEL_PROJECT_ID` | ID del proyecto | `.vercel/project.json` o Settings → General |

---

## ✅ Verificar que todo funciona

Después de agregar los secrets en GitHub:

1. Ve a tu repositorio → Actions
2. Haz clic en "CI - Integración Continua"
3. Ejecuta el workflow manualmente (si está disponible)
4. O haz un push a `main` para activar el CD

---

## 🆘 Problemas Comunes

### "Invalid token"
- Verifica que el token esté correctamente copiado
- Asegúrate de que el token no haya expirado
- Crea un nuevo token si es necesario

### "Organization not found"
- Verifica que el `VERCEL_ORG_ID` sea correcto
- Para cuentas personales, usa el ID de tu cuenta personal (no de una organización)
- Puedes verificar ejecutando: `vercel whoami`

### "Project not found"
- Verifica que el `VERCEL_PROJECT_ID` sea correcto
- Asegúrate de que el proyecto exista en Vercel
- Verifica que el proyecto esté en el scope correcto (personal u organización)

---

## 💡 Tip

Si ya tienes el proyecto desplegado en Vercel, la forma más fácil es:

```bash
cd tu-proyecto
vercel link
cat .vercel/project.json
```

¡Y listo! Tienes todos los IDs que necesitas.





