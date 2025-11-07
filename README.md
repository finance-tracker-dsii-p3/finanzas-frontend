# 💰 Proyecto Finanzas Frontend

Aplicación web para la gestión de finanzas personales, con módulos de autenticación, presupuestos, movimientos y reportes.  
Este repositorio corresponde al **Frontend** del proyecto *Finance Tracker* del curso **Desarrollo de Software I (Proyecto #3)**.

---

## 🧱 Stack Tecnológico

**Frontend:** React, Vite, TypeScript, TailwindCSS, React Router  
**Backend:** Django REST Framework (repositorio separado)  
**Base de Datos:** PostgreSQL  
**Despliegue:** Vercel (frontend) y Render (backend)

---

## ⚙️ Configuración del Entorno Local

### 🔧 Prerrequisitos

Antes de iniciar, asegúrate de tener instalado:

- [Node.js](https://nodejs.org/) (versión **18 o superior**)  
- [npm](https://www.npmjs.com/) (versión **9 o superior**)  
- [Git](https://git-scm.com/)  
- Acceso al repositorio del backend (para conectar la API)

---

## 🚀 Inicialización

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

---

## ⚙️ Configuración del Entorno (.env)

Para conectar con la API del backend, crea un archivo `.env` en la raíz del proyecto con el siguiente contenido:

```bash
VITE_API_URL=http://localhost:8000/api
```

> ⚠️ **Importante:** No subas este archivo al repositorio.  
> Está protegido en `.gitignore` por motivos de seguridad.

---

## 🧩 Ejecución del Proyecto

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

## 🧭 Estructura del Proyecto

```
src/
 ├─ components/        → Componentes reutilizables (Navbar, botones, inputs)
 ├─ context/           → Contextos globales (autenticación, usuario)
 ├─ layouts/           → Plantillas y estructura de vistas
 ├─ pages/             → Páginas principales (Login, Register, Home, etc.)
 ├─ services/          → Comunicación con la API (axios)
 ├─ types/             → Interfaces y tipos TypeScript
 ├─ utils/             → Funciones auxiliares y helpers
 ├─ App.tsx            → Rutas principales y layout base
 ├─ main.tsx           → Punto de entrada de la aplicación
 └─ index.css          → Estilos globales + configuración de TailwindCSS
```

---

## 🧠 Flujo de Trabajo del Equipo

1. **Crear una nueva rama** a partir de `develop`:
   ```bash
   git switch -c feature/HU-01-login-usuario
   ```

2. **Implementar la funcionalidad** (por ejemplo: página de registro o login).  
3. **Probar localmente** ejecutando `npm run dev`.  
4. **Hacer commit y push**:
   ```bash
   git add .
   git commit -m "HU-01: Implementar pantalla de login"
   git push origin feature/HU-01-login-usuario
   ```
5. **Crear un Pull Request** para fusionar con `develop`.

---

## 🔐 Conexión con el Backend

Para pruebas locales, asegúrate de que el backend esté corriendo en  
[http://localhost:8000](http://localhost:8000)

Ejemplo de endpoint de autenticación:

```
POST /api/login/
Body: { "email": "usuario@mail.com", "password": "123456" }
```

El token JWT se almacenará en `localStorage` y se usará para proteger rutas privadas.

---

## 👥 Equipo de Desarrollo

| Rol | Nombre |
|------|---------|
| Product Owner | Mauricio Teherán |
| Scrum Master / Líder Frontend | Hernán García |
| Frontend Dev | Julieta Arteta |
| Backend Devs | David Reyes, Juan Camilo Jiménez |

---

## 🧩 Próximos Sprints

- **Sprint 1:** Registro, Login, Recuperar Contraseña, Navbar  
- **Sprint 2:** Gestión de cuentas y presupuestos  
- **Sprint 3:** Reportes financieros y alertas  
- **Sprint 4:** Despliegue y documentación final

---

## 🧰 Comandos Útiles

| Comando | Descripción |
|----------|--------------|
| `npm run dev` | Ejecuta el proyecto en modo desarrollo |
| `npm run build` | Genera build de producción |
| `npm run preview` | Previsualiza la build |
| `npm run lint` | Ejecuta ESLint para verificar el código |

---

## 🏁 Listo 🎉

Una vez completes los pasos anteriores, podrás ver la aplicación ejecutándose en tu entorno local.
