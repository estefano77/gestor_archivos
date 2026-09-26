# CloudVault • Gestor de Archivos Seguro

Aplicación web moderna y robusta construida con **Next.js (App Router)**, **TypeScript**, **Tailwind CSS** y **MongoDB**, lista para desplegarse en **Vercel**. Permite subir, organizar en carpetas temáticas, previsualizar y descargar archivos con **control de acceso estricto por cada usuario** y una **cuota de 25 MB por cuenta**. Incluye un **manual de usuario integrado** en `/help`.

---

## 🚀 Características Principales

- **Formatos Soportados:**
  - 📄 **PDF**: Visor embebido con la barra de herramientas nativa del navegador (miniaturas, páginas, zoom e impresión) y opción de abrir en pestaña nueva.
  - 🖼️ **Imágenes**: PNG, JPG, JPEG, WebP, GIF, SVG con visor ampliado y zoom del 50% al 300%.
  - 📝 **Word**: `.docx`, `.doc` con tarjeta de inspección de metadatos (tipo MIME, fecha, nota y etiquetas) y descarga inmediata.
  - 📗 **Excel**: `.xlsx`, `.xls` con la misma tarjeta de inspección de metadatos y descarga directa.
  - 📊 **PowerPoint**: `.pptx`, `.ppt` con tarjeta de inspección y descarga directa.
  - 🚫 Cualquier otro formato se rechaza tanto en el cliente como en la API. Límite de **15 MB** por archivo.
- **Cuota de Almacenamiento Real por Usuario:**
  - Cada cuenta dispone de **25 MB** en total. El límite se aplica en el servidor (`POST /api/files` responde **413** si no cabe) y se muestra en el panel antes de llegar a ese punto.
  - El panel de almacenamiento indica el porcentaje usado y **cuántos MB quedan**, en ámbar a partir del 80% y en rojo cuando la cuota se agota.
  - Con la cuota llena el botón «Subir Archivo» pasa a «Sin espacio» y el formulario de subida se deshabilita.
  - Los 15 MB son un tope **por archivo** y los 25 MB son el **total**: no es lo mismo. El límite por archivo existe porque el binario se guarda dentro del documento de MongoDB, que no puede pasar de 16 MB.
- **Carpetas Temáticas (carpetas lógicas):**
  - Crea, renombra y elimina carpetas con **nombre, color (6 opciones) y descripción**.
  - Asigna un archivo a una carpeta al subirlo, o muévelo después desde el menú de la tarjeta/fila o el modal **"Mover a carpeta"**.
  - Puedes elegir una carpeta existente o crear una nueva sin salir del modal de subida.
  - Barra de **chips filtrables** con el conteo de archivos por carpeta y un chip **"Sin carpeta"** para los archivos sueltos.
  - Cada archivo muestra una **etiqueta 📁 clicable** que filtra el listado por esa carpeta.
  - Renombrar una carpeta actualiza la carpeta de todos sus archivos; eliminarla borra también su contenido.
- **Manual de Usuario Integrado (`/help`):**
  - Guía en español para el usuario final, con índice lateral, scroll-spy y 13 secciones ilustradas con capturas reales de la interfaz.
  - Se alcanza desde el icono de libro en la barra superior y desde un enlace en la pantalla de acceso. Es **pública**: no exige sesión.
  - El contenido vive en `src/lib/help-content.ts` como datos, separado del JSX, para que actualizar un texto no obligue a tocar la interfaz.
  - Las capturas se montan sobre un marco claro fijo para que se lean bien también en tema oscuro, y se pueden ampliar con un clic.
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
- **Node.js 20.9 o superior.** Next.js 16 lo exige: en `node_modules/next/package.json` figura
  `"engines": { "node": ">=20.9.0" }`. Con Node 18 la instalación falla, así que no es opcional.
- Instancia de MongoDB (local en `mongodb://localhost:27017` o clúster gratuito en [MongoDB Atlas](https://www.mongodb.com/atlas))
- Python 3 (opcional). Solo hace falta si vas a regenerar las capturas del manual; la
  aplicación no lo usa. Ver la sección «🖼️ Regenerar las capturas del manual» más abajo.

### 2. Variables de Entorno
Crea o edita el archivo `.env.local` en la raíz del proyecto:

```env
# Conexión a MongoDB (Local o MongoDB Atlas)
MONGODB_URI=mongodb://127.0.0.1:27017/gestor_archivos

# Clave secreta para firmar tokens JWT (mínimo 32 caracteres)
JWT_SECRET=pega_aqui_un_secreto_aleatorio_de_32_caracteres_o_mas

# Nombre de la aplicación
NEXT_PUBLIC_APP_NAME="CloudVault - Gestor de Archivos"

# Credenciales de Google (opcional, solo para iniciar sesión con Google)
GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu-client-secret
```

> ⚠️ **Genera tu propio `JWT_SECRET`, no copies el de ejemplo.**
>
> Este repositorio es público, así que cualquier valor que pongas en él queda
> comprometido. Con el secreto de firma a la vista, cualquiera puede crear un
> token de sesión válido con el identificador de usuario que quiera y acceder a
> los archivos de cualquier cuenta. Genera uno con:
>
> ```bash
> node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
> ```
>
> Al cambiar el secreto se invalidan las sesiones abiertas: los usuarios
> tendrán que volver a iniciar sesión. No se pierde ningún archivo.

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

> ⚠️ **El clúster M0 gratuito da 512 MB de almacenamiento en total, no 512 MB por usuario.**
> Como cada cuenta consume hasta 25 MB, el plan gratuito alcanza para unas **20 cuentas
> llenas**. Antes de llegar a ese punto, Atlas bloquea las escrituras y la aplicación
> empezará a fallar al subir archivos. Si necesitas más usuarios, sube al plan **Flex**
> (5 GB) o_dimensiona el clúster desde el panel de Atlas.
>
> Ten en cuenta también que el M0 **no tiene backups** y está limitado a 100 operaciones por
> segundo. Nada de lo que se borre se puede recuperar.

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
   - `JWT_SECRET`: Una cadena aleatoria generada por ti. **No uses ningún valor de ejemplo de este repositorio**: al ser público, permitiría a un tercero falsificar sesiones y leer los archivos de cualquier usuario. Genérala con `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`.
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
│   ├── help/page.tsx           # Manual de usuario (público, con índice y scroll-spy)
│   ├── layout.tsx              # Layout principal con tipografías, tema y metadatos
│   ├── globals.css             # Estilos globales, utilidades glass y modo oscuro
│   └── page.tsx                # Dashboard: Gestor de Archivos, Carpetas y Analytics
├── components/
│   ├── Navbar.tsx              # Barra superior con perfil, ayuda y botón de subida
│   ├── Footer.tsx              # Pie de página con el copyright y el año actual
│   ├── StorageStats.tsx        # Métricas, barra de capacidad multicolor y cuota real
│   ├── FileUploadModal.tsx     # Zona Drag & Drop + selector/creación de carpeta temática
│   ├── FileCard.tsx            # Tarjeta para vista de cuadrícula (con etiqueta de carpeta)
│   ├── FileListItem.tsx        # Fila para vista de lista (con etiqueta de carpeta)
│   ├── FilePreviewModal.tsx    # Visor modal (PDF interactivo, fotos, docs)
│   ├── RenameModal.tsx         # Modal para editar nombre, notas, etiquetas y carpeta
│   ├── MoveFileModal.tsx       # Modal para mover un archivo entre carpetas temáticas
│   ├── FolderModal.tsx         # Modal para crear/editar carpeta (nombre, color, descripción)
│   ├── DeleteFolderModal.tsx   # Confirmación de eliminación de carpeta y su contenido
│   ├── DeleteModal.tsx         # Modal de confirmación de eliminación segura
│   ├── HelpImage.tsx           # Captura del manual con pie de foto y lupa al ampliarla
│   ├── ThemeProvider.tsx       # Contexto de tema claro/oscuro con persistencia
│   └── ThemeToggle.tsx         # Botón de cambio de tema en la barra superior
├── lib/
│   ├── mongodb.ts              # Conexión persistente en caché para Serverless/Vercel
│   ├── model-registry.ts       # Registro de modelos Mongoose seguro ante hot-reload
│   ├── auth.ts                 # Creación y verificación de tokens JWT con jose
│   ├── file-utils.ts           # Categorías, colores, límites de tamaño/cuota y formateo
│   └── help-content.ts         # Contenido del manual como datos (13 secciones)
└── models/
    ├── User.ts                 # Modelo Mongoose de usuarios
    ├── FileItem.ts             # Modelo Mongoose de archivos (buffer binario + campo `folder`)
    └── Folder.ts               # Modelo Mongoose de carpetas temáticas (nombre, color, descripción)

public/
└── help/                       # 16 capturas de pantalla que ilustran el manual

# Scripts sueltos en la raíz (no forman parte de la app)
dbcheck.mjs                    # Volca usuarios, archivos y carpetas de la BD
seed-help-samples.py           # Genera los 5 archivos de muestra (PDF, PNG, docx, xlsx, pptx)
seed-help.mjs                  # Siembra la cuenta y los archivos de demostración
seed-help-quota.mjs            # Rellena la cuota para capturar los estados de aviso/agotada
```

> **Nota sobre `model-registry.ts`:** los modelos se registran a través de este helper en lugar
> de `mongoose.models.X || mongoose.model(...)`. La caché de `mongoose.models` sobrevive a las
> recargas de módulos de Next.js, por lo que al cambiar un esquema el proceso seguiría usando el
> modelo viejo y Mongoose (modo `strict`) descartaría los campos nuevos **en silencio**.

**Nota sobre el límite de 15 MB por archivo:** no es una decisión de diseño, es un tope que
impone el almacenamiento. El binario se guarda **dentro** del documento (`fileData`), y BSON
no admite documentos de más de 16 MB. Subir ese límite exigiría mover los binarios fuera de
MongoDB (S3, GridFS, etc.) y cambiar el modelo de datos.

### Cambiar los límites

Los tres valores viven en `src/lib/file-utils.ts` y se importan desde el servidor y el
cliente, así que no pueden quedar desincronizados:

```ts
export const MAX_FILE_SIZE = 15 * 1024 * 1024;      // tope por archivo
export const USER_QUOTA_BYTES = 25 * 1024 * 1024;  // cuota por cuenta
export const QUOTA_WARN_RATIO = 0.8;                // umbral del aviso en ámbar
```

El manual de `/help` lee esas mismas constantes, de modo que la documentación mostrada al
usuario se actualiza sola al cambiar un valor. **Subir `MAX_FILE_SIZE` por encima de 15 MB
no funciona** por el límite de BSON descrito arriba.

---

## 🖼️ Regenerar las capturas del manual

Las 16 imágenes de `public/help/` son capturas reales de la interfaz. Para rehacerlas
(por ejemplo, después de rediseñar el panel) hay que repetir tres pasos:

```bash
# 1. MongoDB debe estar levantado (el de la instalación local)
mongod --dbpath C:\data\db

# 2. Crear los archivos de muestra y la cuenta de demostración
python seed-help-samples.py .help-samples
node seed-help.mjs

# 3. Levantar la app y capturar pantalla a pantalla
npm run dev
```

Para los estados de cuota (aviso y agotada) hay un script aparte que añade archivos de
relleno hasta el porcentaje indicado:

```bash
node seed-help-quota.mjs 0.85   # ~85% usado: estado de aviso
node seed-help-quota.mjs 1.0    # 100% usado: cuota agotada
```

**Limpieza.** Todo cuelga de la cuenta `ayuda@cloudvault.app`, así que la limpieza es
quirúrgica y no puede tocar los datos reales de la base:

```bash
node seed-help-quota.mjs --clear   # quita solo el relleno de cuota
node seed-help.mjs --clean         # borra la cuenta, sus carpetas y sus archivos
```

> **Sugerencia:** mientras se capturan las imágenes, poner `devIndicators: false` en
> `next.config.ts` para que el badge de desarrollo de Next no aparezca en las capturas.
> Acuérdese de quitarlo después: solo existe en desarrollo.
