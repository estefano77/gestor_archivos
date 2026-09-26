# CloudVault • Gestor de Archivos Seguro

Aplicación web moderna y robusta construida con **Next.js (App Router)**, **TypeScript**, **Tailwind CSS** y **MongoDB**, lista para desplegarse en **Vercel**. Permite subir, organizar en carpetas temáticas, previsualizar y descargar archivos con **control de acceso estricto por cada usuario**.

---

## 🚀 Características Principales

- **Formatos Soportados:**
  - 📄 **PDF**: Visor embebido con la barra de herramientas nativa del navegador (miniaturas, páginas, zoom e impresión) y opción de abrir en pestaña nueva.
  - 🖼️ **Imágenes**: PNG, JPG, JPEG, WebP, GIF, SVG con visor ampliado y zoom del 50% al 300%.
  - 📝 **Word**: `.docx`, `.doc` con tarjeta de inspección de metadatos (tipo MIME, fecha, nota y etiquetas) y descarga inmediata.
  - 📗 **Excel**: `.xlsx`, `.xls` con la misma tarjeta de inspección de metadatos y descarga directa.
  - 📊 **PowerPoint**: `.pptx`, `.ppt` con tarjeta de inspección y descarga directa.
  - 🚫 Cualquier otro formato se rechaza tanto en el cliente como en la API. Límite de **15 MB** por archivo.
- **Carpetas Temáticas (carpetas lógicas):**
  - Crea, renombra y elimina carpetas con **nombre, color (6 opciones) y descripción**.
  - Asigna un archivo a una carpeta al subirlo, o muévelo después desde el menú de la tarjeta/fila o el modal **"Mover a carpeta"**.
  - Puedes elegir una carpeta existente o crear una nueva sin salir del modal de subida.
  - Barra de **chips filtrables** con el conteo de archivos por carpeta y un chip **"Sin carpeta"** para los archivos sueltos.
  - Cada archivo muestra una **etiqueta 📁 clicable** que filtra el listado por esa carpeta.
  - Renombrar una carpeta actualiza la carpeta de todos sus archivos; eliminarla borra también su contenido.
- **Acceso Controlado por Usuario (Autenticación Segura):**
  - Registro e Inicio de sesión con contraseñas encriptadas con **bcryptjs**.
  - Sesiones seguras mediante **JWT (HTTP-Only Cookies)** a través de la librería `jose`.
  - Cada usuario solo puede ver, buscar, previsualizar, editar, mover y eliminar sus propios archivos.
- **Almacenamiento Directo en MongoDB:**
  - No requiere configuración compleja de buckets S3 o servicios de terceros.
  - Los archivos se almacenan en MongoDB como buffers binarios optimizados (hasta 15 MB por archivo).
  - Las carpetas temáticas son **lógicas**: se guardan como un campo del documento, no como rutas ni directorios del disco.
  - Compatible 100% con las funciones Serverless de **Vercel**: al no escribir binarios en el sistema de archivos (allí efímero y de solo lectura) no hay dependencias de disco volátil.
- **Diseño Ultra-Moderno con Tailwind CSS:**
  - **Tema claro y oscuro** conmutables, con detección de la preferencia del sistema y persistencia en `localStorage`.
  - Efectos de *glassmorphism* y gradientes elegantes en ambos temas.
  - Iconos vistosos con **Lucide React**.
  - Zona interactiva Drag & Drop para subir archivos.
  - Selector de vista en **Cuadrícula (Grid)** o **Lista (List)**.
  - Barra de almacenamiento en tiempo real con desglose por tipo de archivo.
  - Filtro por categoría y por carpeta, buscador en vivo (nombre, nota, etiqueta o carpeta) y ordenamiento por fecha, nombre y tamaño.
  - **Optimizado para móvil (probado en iPhone 13)**: sin desplazamiento horizontal, modales en *hoja inferior* con scroll interno y la barra de acciones siempre visible, respeto de las zonas seguras (isla dinámica e indicador de inicio), campos de 16px para evitar el zoom automático de iOS y objetivos táctiles de 40–44px.

---

## 🛠️ Tecnologías

- **Framework:** Next.js 16 (App Router + Server & Client Components)
- **Lenguaje:** TypeScript
- **Estilos:** Tailwind CSS v4 (variante `dark` personalizada sobre la clase `.dark`)
- **Iconografía:** Lucide React
- **Base de Datos:** MongoDB (Mongoose 9 con Connection Pooling para Serverless)
- **Modelo de datos:** usuarios, archivos (buffer binario + campo `folder`) y carpetas temáticas
- **Autenticación:** JWT (jose) + Cookies seguras + Bcryptjs
- **Tema claro/oscuro:** React Context + `localStorage` + `prefers-color-scheme`
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

### 4. Probar desde el móvil (red local)
Al arrancar, el servidor imprime una URL de red, por ejemplo `http://192.168.56.1:3000`. Ábrela en
el móvil conectado a la misma red WiFi.

`next.config.ts` ya incluye `allowedDevOrigins` con los rangos de red privados. Es necesario:
Next 16 bloquea por defecto los recursos de desarrollo (`/_next/hmr` y los chunks del cliente)
cuando el origen no es `localhost`. Sin esa lista el cliente **no se hidrata** y los formularios
se envían de forma nativa, por lo que la aplicación parece no funcionar.

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
│   │   ├── auth/               # Rutas API de Registro, Login, Me y Logout
│   │   ├── files/              # Rutas API de Listado, Subida, Streaming y Descargas
│   │   │   ├── route.ts        # GET: listar, filtrar, buscar y ordenar | POST: subir
│   │   │   ├── [id]/
│   │   │   │   ├── route.ts    # PATCH: renombrar, editar nota/etiquetas y mover de carpeta | DELETE
│   │   │   │   ├── preview/    # Transmisión binaria inline para visor PDF/imágenes
│   │   │   │   └── download/   # Descarga directa de archivos (Word, Excel, PPT, etc.)
│   │   │   └── stats/          # Agregaciones de almacenamiento en MongoDB
│   │   └── folders/            # Rutas API de Carpetas Temáticas (carpetas lógicas)
│   │       ├── route.ts        # GET: carpetas con conteo y tamaño | POST: crear carpeta
│   │       └── [id]/route.ts   # PATCH: renombrar, cambiar color/descripción | DELETE: con sus archivos
│   ├── auth/page.tsx           # Interfaz de Login y Registro
│   ├── layout.tsx              # Layout principal con tipografías, tema y metadatos
│   ├── globals.css             # Estilos globales, utilidades glass y modo oscuro
│   └── page.tsx                # Dashboard: Gestor de Archivos, Carpetas y Analytics
├── components/
│   ├── Navbar.tsx              # Barra superior con perfil y botón de subida
│   ├── Footer.tsx              # Pie de página con el copyright y el año actual
│   ├── StorageStats.tsx        # Métricas y barra de capacidad multicolor
│   ├── FileUploadModal.tsx     # Zona Drag & Drop + selector/creación de carpeta temática
│   ├── FileCard.tsx            # Tarjeta para vista de cuadrícula (con etiqueta de carpeta)
│   ├── FileListItem.tsx        # Fila para vista de lista (con etiqueta de carpeta)
│   ├── FilePreviewModal.tsx    # Visor modal (PDF interactivo, fotos, docs)
│   ├── RenameModal.tsx         # Modal para editar nombre, notas, etiquetas y carpeta
│   ├── MoveFileModal.tsx       # Modal para mover un archivo entre carpetas temáticas
│   ├── FolderModal.tsx         # Modal para crear/editar carpeta (nombre, color, descripción)
│   ├── DeleteFolderModal.tsx   # Confirmación de eliminación de carpeta y su contenido
│   ├── DeleteModal.tsx         # Modal de confirmación de eliminación segura
│   ├── ThemeProvider.tsx       # Contexto de tema claro/oscuro con persistencia
│   └── ThemeToggle.tsx         # Botón de cambio de tema en la barra superior
├── lib/
│   ├── mongodb.ts              # Conexión persistente en caché para Serverless/Vercel
│   ├── model-registry.ts       # Registro de modelos Mongoose seguro ante hot-reload
│   ├── auth.ts                 # Creación y verificación de tokens JWT con jose
│   └── file-utils.ts           # Categorías, colores de carpetas, iconos y formateo de bytes
└── models/
    ├── User.ts                 # Modelo Mongoose de usuarios
    ├── FileItem.ts             # Modelo Mongoose de archivos (buffer binario + campo `folder`)
    └── Folder.ts               # Modelo Mongoose de carpetas temáticas (nombre, color, descripción)
```

> **Nota sobre `model-registry.ts`:** los modelos se registran a través de este helper en lugar
> de `mongoose.models.X || mongoose.model(...)`. La caché de `mongoose.models` sobrevive a las
> recargas de módulos de Next.js, por lo que al cambiar un esquema el proceso seguiría usando el
> modelo viejo y Mongoose (modo `strict`) descartaría los campos nuevos **en silencio**.
