# CloudVault • Gestor de Archivos Seguro

Aplicación web moderna y robusta construida con **Next.js (App Router)**, **TypeScript**, **Tailwind CSS** y **MongoDB**, lista para desplegarse en **Vercel**. Permite subir, organizar, previsualizar y descargar archivos con **control de acceso estricto por cada usuario**.

---

## 🚀 Características Principales

- **Formatos Soportados:**
  - 📄 **PDF**: Visor integrado con zoom, miniaturas, páginas e impresión nativa.
  - 🖼️ **Imágenes**: PNG, JPG, JPEG, WebP, GIF, SVG con vista previa ampliada y zoom dinámico.
  - 📝 **Word**: `.docx`, `.doc` con tarjeta de inspección de metadatos y descarga inmediata.
  - 📊 **PowerPoint**: `.pptx`, `.ppt` con indicador de presentación y descarga optimizada.
- **Acceso Controlado por Usuario (Autenticación Segura):**
  - Registro e Inicio de sesión con contraseñas encriptadas con **bcryptjs**.
  - Sesiones seguras mediante **JWT (HTTP-Only Cookies)** a través de la librería `jose`.
  - Cada usuario solo puede ver, buscar, previsualizar, editar y eliminar sus propios archivos.
- **Almacenamiento Directo en MongoDB:**
  - No requiere configuración compleja de buckets S3 o servicios de terceros.
  - Los archivos se almacenan en MongoDB como buffers binarios optimizados (hasta 15 MB por archivo).
  - Compatible 100% con las funciones Serverless de **Vercel** (evita problemas de sistemas de archivos de solo lectura).
- **Diseño Ultra-Moderno con Tailwind CSS:**
  - Tema oscuro con efectos de *glassmorphism* y gradientes elegantes.
  - Iconos vistosos con **Lucide React**.
  - Zona interactiva Drag & Drop para subir archivos.
  - Selector de vista en **Cuadrícula (Grid)** o **Lista (List)**.
  - Barra de almacenamiento en tiempo real con desglose por tipo de archivo.
  - Filtro por categoría, buscador en vivo y ordenamiento por fecha, nombre y tamaño.

---

## 🛠️ Tecnologías

- **Framework:** Next.js 16 (App Router + Server & Client Components)
- **Lenguaje:** TypeScript
- **Estilos:** Tailwind CSS v4
- **Iconografía:** Lucide React
- **Base de Datos:** MongoDB (Mongoose con Connection Pooling para Serverless)
- **Autenticación:** JWT (jose) + Cookies seguras + Bcryptjs
- **Plataforma de despliegue recomendada:** Vercel

---

## ⚙️ Configuración Local

### 1. Requisitos previos
- Node.js v18+ o v22+
- Instancia de MongoDB (local en `mongodb://localhost:27017` o clúster gratuito en [MongoDB Atlas](https://www.mongodb.com/atlas))

### 2. Variables de Entorno
Crea o edita el archivo `.env.local` en la raíz del proyecto:

```env
# Conexión a MongoDB (Local o MongoDB Atlas)
MONGODB_URI=mongodb://127.0.0.1:27017/gestor_archivos

# Clave secreta para firmar tokens JWT (mínimo 32 caracteres)
JWT_SECRET=super_secret_jwt_key_gestor_archivos_2026_vercel_production

# Nombre de la aplicación
NEXT_PUBLIC_APP_NAME="CloudVault - Gestor de Archivos"
```

### 3. Iniciar el servidor de desarrollo
```bash
npm run dev
```

Abre tu navegador en [http://localhost:3000](http://localhost:3000).

---

## ☁️ Despliegue en Vercel (Paso a Paso)

La aplicación está lista para producción en Vercel sin configuraciones adicionales de servidor:

### Paso 1: Crear una base de datos en MongoDB Atlas (Gratis)
1. Ve a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) y crea un clúster gratuito (*M0 Shared Sandbox*).
2. En **Database Access**, crea un usuario y contraseña para la base de datos.
3. En **Network Access**, agrega la IP `0.0.0.0/0` (Allow access from anywhere) para permitir conexiones desde las funciones serverless de Vercel.
4. En **Database** > **Connect** > **Drivers**, copia la cadena de conexión:
   ```text
   mongodb+srv://<usuario>:<password>@cluster0.xxxxx.mongodb.net/gestor_archivos?retryWrites=true&w=majority
   ```

### Paso 2: Subir tu código a GitHub / GitLab
```bash
git add .
git commit -m "feat: CloudVault Gestor de Archivos con MongoDB y Vercel"
git push origin main
```

### Paso 3: Importar el proyecto en Vercel
1. Ingresa a [vercel.com](https://vercel.com) e inicia sesión.
2. Haz clic en **"Add New..."** > **"Project"**.
3. Selecciona tu repositorio de GitHub.
4. En la sección **Environment Variables**, añade:
   - `MONGODB_URI`: Tu cadena de conexión de MongoDB Atlas copiada en el Paso 1.
   - `JWT_SECRET`: Una cadena segura aleatoria (ej: `clave_ultra_secreta_para_produccion_en_vercel_2026_xyz`).
5. Haz clic en **"Deploy"**. ¡Listo! En segundos tu aplicación estará en vivo con HTTPS y CDN global.

---

## 🔒 Estructura del Proyecto

```
src/
├── app/
│   ├── api/
│   │   ├── auth/           # Rutas API de Registro, Login, Me y Logout
│   │   └── files/          # Rutas API de Listado, Subida, Streaming y Descargas
│   │       ├── [id]/
│   │       │   ├── preview/   # Transmisión binaria inline para visor PDF/imágenes
│   │       │   └── download/  # Descarga directa de archivos (Word, PPT, etc.)
│   │       └── stats/         # Agregaciones de almacenamiento en MongoDB
│   ├── auth/page.tsx       # Interfaz de Login y Registro
│   ├── layout.tsx          # Layout principal con tipografías y tema
│   └── page.tsx            # Dashboard: Gestor de Archivos y Analytics
├── components/
│   ├── Navbar.tsx          # Barra superior con perfil y botón de subida
│   ├── StorageStats.tsx    # Métricas y barra de capacidad multicolor
│   ├── FileUploadModal.tsx # Zona Drag & Drop para subir archivos
│   ├── FileCard.tsx        # Tarjeta para vista de cuadrícula
│   ├── FileListItem.tsx    # Fila para vista de lista
│   ├── FilePreviewModal.tsx# Visor modal (PDF interactivo, fotos, docs)
│   ├── RenameModal.tsx     # Modal para editar nombre y notas
│   └── DeleteModal.tsx     # Modal de confirmación de eliminación segura
├── lib/
│   ├── mongodb.ts          # Conexión persistente en caché para Serverless/Vercel
│   ├── auth.ts             # Creación y verificación de tokens JWT con jose
│   └── file-utils.ts       # Mapeo de categorías, iconos y formateo de bytes
└── models/
    ├── User.ts             # Modelo Mongoose de usuarios
    └── FileItem.ts         # Modelo Mongoose de archivos con buffers binarios
```
