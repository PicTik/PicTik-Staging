---
name: fullstack-web-dev
description: Desarrollo full stack con React 19, tRPC y Drizzle ORM para PicTik (plataforma de entrega de fotos). Incluye frontend, backend, base de datos y patrones arquitectónicos.
---

# Habilidad: Desarrollo Web Full Stack (PicTik)

Esta habilidad define las reglas, patrones y estándares para el desarrollo de funcionalidades Full Stack en el proyecto PicTik, una plataforma SaaS de entrega de fotografías. Las instrucciones aquí detalladas deben ser seguidas estrictamente por cualquier agente o sub-agente que modifique el código.

## Arquitectura del Proyecto

PicTik utiliza una arquitectura basada en un monorepositorio que separa claramente el cliente, el servidor, los esquemas de base de datos y el código compartido.

### Estructura Monorepo
- **`client/`**: Aplicación frontend (React 19 + Vite).
- **`server/`**: Aplicación backend (Node.js + Express 4 + tRPC).
- **`drizzle/`**: Migraciones y configuración del ORM.
- **`shared/`**: Tipos, esquemas Zod y código compartido entre cliente y servidor.

### Principios Fundamentales
1. **TypeScript de Extremo a Extremo**: Se debe mantener estricto tipado en todo el stack. Utilizamos tRPC como puente tipado entre el frontend y el backend para garantizar que los contratos de la API sean seguros y autocompletables en el cliente.
2. **Herramientas de Construcción**: 
   - `Vite` se usa para el bundling del cliente (rápido y optimizado).
   - `esbuild` se usa para compilar el servidor.
   - Ambos procesos generan su salida en el directorio `dist/`.
3. **Gestión de Dependencias**: El proyecto utiliza **pnpm** exclusivamente. NO utilices `npm` o `yarn`.

---

## Frontend (React 19 + Vite + Tailwind CSS 4)

El frontend debe ser rápido, accesible y altamente responsivo (PC y móvil).

### Component Architecture
- **Radix/Shadcn Primitives**: Construye interfaces utilizando componentes base accesibles. Prefiere extender estos componentes antes de crear implementaciones desde cero.
- **Componentes Personalizados**: Ubícalos en `client/src/components`. Mantén una estructura de "presentación" vs "contenedores lógicos" cuando sea aplicable.

### Enrutamiento y Estado
- **Routing con Wouter**: Utilizamos `wouter` por ser ligero y basado en hooks. Mantén la definición de rutas simple en el punto de entrada de la aplicación.
- **State Management**: Para flujos complejos (como galerías fotográficas), utiliza patrones de estado predecibles (Context API + reducers, o Zustand si está instalado). Evita el prop drilling.

### Diseño y UI/UX
- **Responsive / Mobile-First**: Diseña siempre pensando en el móvil primero. Utiliza los breakpoints estándar de Tailwind (`sm`, `md`, `lg`, `xl`) para adaptar la UI a pantallas más grandes. El diseño debe funcionar perfectamente en viewports desde 320px hasta 1920px.
- **Animaciones**: Utiliza `Framer Motion` para transiciones fluidas. **Crucial:** Respeta siempre la preferencia del sistema `prefers-reduced-motion` para garantizar la accesibilidad a usuarios con sensibilidad al movimiento.

### Optimización y Media
- **Image Optimization**: Al tratar con fotos (core business de PicTik), implementa lazy loading (`loading="lazy"`), formatos modernos como WebP y atributos `srcset` para servir el tamaño adecuado según el dispositivo.
- El pipeline de procesamiento backend usa `Sharp`, pero el frontend debe solicitar y renderizar las versiones optimizadas.

### Accesibilidad (WCAG 2.1 AA)
- Usa HTML semántico (`<main>`, `<nav>`, `<article>`).
- Provee atributos `aria-*` adecuados cuando la semántica no sea suficiente.
- Garantiza la navegación por teclado (keyboard nav) y maneja el foco visual explícitamente (focus management), especialmente en modales y menús desplegables.

### Internacionalización (i18n)
- Diseña pensando en los mercados LATAM (`es-CO`, `es-MX`, `es-EC`, `es-AR`, `es-CL`).
- Formatea precios, fechas y números utilizando la API `Intl` nativa o la librería i18n configurada, respetando las peculiaridades locales (ej. separadores de miles).

---

## Backend (Node.js + Express 4 + tRPC 11)

El backend actúa como motor de negocio, orquestador de pagos y manejador de almacenamiento seguro.

### Estructura de API y Enrutamiento
- **tRPC Router**: Todos los procedimientos RPC (queries y mutations) deben residir bajo `/api/trpc`. Estructura los routers por dominio de negocio (ej. `usersRouter`, `galleriesRouter`).
- **Express Middleware Stack**:
  - Implementa security headers (helmet, CSP, HSTS).
  - Configura CORS de forma estricta (solo orígenes permitidos).
  - Maneja el body parsing antes de las rutas.

### Validación y Seguridad
- **Zod Schemas**: NUNCA confíes en el input del cliente. Cada procedimiento tRPC debe tener un `input` validado por un esquema Zod.
- **Errores**: Utiliza errores tipados de tRPC (`TRPCError`). No expongas stack traces en producción; loggea el error real en el servidor pero devuelve mensajes genéricos al cliente.

### Procesamiento de Archivos y Almacenamiento
- **Pipeline de Imágenes**: Utiliza `Sharp` para generar thumbnails y marcas de agua.
- **Descargas Masivas**: Usa `Archiver` para empaquetar fotos en ZIP al vuelo.
- **Almacenamiento (Cloudflare R2)**: Integra almacenamiento compatible con S3. Utiliza URLs prefirmadas (presigned URLs) para lecturas y escrituras directas desde/hacia el cliente cuando sea posible, para reducir la carga de red en el servidor Node.

---

## Base de Datos (MySQL/TiDB + Drizzle)

La base de datos es el centro de la verdad. Mantenemos el esquema ordenado y migrable.

### Esquema y Relaciones
- Tablas principales: `users`, `galleries`, `photos`, `subscriptions`, `webhookEvents`, `consentRecords`, `auditLog`.
- Define relaciones claras. Configura ON DELETE/ON UPDATE adecuadamente en las claves foráneas.

### Drizzle Query Patterns
- Utiliza la API relacional de Drizzle para consultas complejas (`db.query...`).
- Envuelve operaciones múltiples en transacciones de Drizzle para garantizar la atomicidad (ej. crear una galería y asignar fotos simultáneamente).

### Migraciones y Salud
- Estrategia de migración: Modifica los archivos en `drizzle/schema.ts`, luego usa `pnpm drizzle-kit generate` para crear la migración y `pnpm db:push` para aplicarla en desarrollo.
- Implementa connection pooling y endpoints de health checks para monitorear la salud de la BD.

### Regla de Oro de Almacenamiento
- NUNCA almacenes archivos binarios (imágenes, ZIPs) en la base de datos.
- La base de datos SOLO debe contener referencias, URLs o metadata apuntando al Cloudflare R2 bucket.

---

## Patrones de Decisión para Sub-agentes

Cuando actúes de manera autónoma, utiliza estos árboles de decisión antes de escribir código:

### 1. ¿Crear un nuevo componente frontend o reutilizar?
- **Paso 1**: ¿Existe un componente Shadcn/Radix que cubra el 80% de la necesidad? 
  - *Sí*: Reutiliza y adapta con Tailwind classes.
  - *No*: Ve al paso 2.
- **Paso 2**: ¿El componente es puramente de presentación y se usará en 3+ lugares?
  - *Sí*: Crea un componente en `client/src/components/ui`.
  - *No*: Impleméntalo directamente en la vista actual o crea un componente local en la misma carpeta.

### 2. ¿Usar procedimiento tRPC vs Ruta Express tradicional?
- **Paso 1**: ¿El cliente es la SPA de Vite (React)?
  - *Sí*: Usa **tRPC** para mantener el tipado y los beneficios de react-query.
  - *No*: Ve al paso 2.
- **Paso 2**: ¿Es un webhook de terceros (ej. Rapyd webhooks)?
  - *Sí*: Usa una ruta **Express estándar**, ya que los webhooks necesitan validación HMAC cruda del body y los proveedores externos no entienden tRPC.

### 3. ¿Client-Side Rendering (CSR) vs Server-Side Rendering (SSR)?
- **Decisión Arquitectónica Fija**: PicTik utiliza CSR a través de Vite. 
- *Acción*: Genera componentes asumiendo CSR. Maneja los estados de carga asíncrona adecuadamente (skeletons, spinners).

### 4. Checkpoint antes de crear una nueva tabla DB
Antes de ejecutar la creación:
1. Analizar el modelo de dominio.
2. Justificar las relaciones (1:1, 1:N, N:M).
3. Verificar la creación de Claves Foráneas (FK) correctas.
4. Definir índices para optimizar las consultas comunes (ej. `gallery_id` en la tabla `photos`).

---

## Estructura de Carpetas Estándar

Respeta esta jerarquía al añadir archivos:

```text
/
├── client/                 # Frontend React/Vite
│   ├── src/
│   │   ├── components/     # Componentes UI reutilizables (Shadcn)
│   │   ├── hooks/          # Custom React hooks
│   │   ├── pages/          # Vistas / Rutas (Wouter)
│   │   ├── lib/            # Utilidades cliente (tRPC client, utils)
│   │   └── App.tsx         # Raíz y router
│   ├── index.html
│   └── vite.config.ts
├── server/                 # Backend Node/Express
│   ├── src/
│   │   ├── api/            # Rutas Express (webhooks)
│   │   ├── trpc/           # Routers de tRPC
│   │   ├── services/       # Lógica de negocio (R2, Rapyd, Sharp)
│   │   ├── middleware/     # Auth, error handling
│   │   └── index.ts        # Punto de entrada Express
├── shared/                 # Código compartido
│   ├── schema.ts           # Drizzle schema
│   └── types.ts            # Interfaces y Zod schemas compartidos
├── drizzle/                # Migraciones DB
├── dist/                   # Salida de build (ignorada en git)
└── package.json            # Scripts pnpm
```

---

## Criterios de Salida

Antes de dar por finalizada una tarea Full Stack, debes verificar afirmativamente lo siguiente:

- [ ] **TypeScript estricto**: Todo el código compila sin errores. Se puede verificar ejecutando `pnpm check` (tsc --noEmit).
- [ ] **Build limpio**: El proyecto compila para producción exitosamente (`pnpm build`).
- [ ] **Tests unitarios/integración**: Todos los tests deben pasar (`pnpm test`).
- [ ] **Responsive Design**: La UI fue probada lógicamente para adaptarse sin romper el layout en un rango de viewport de 320px a 1920px.
- [ ] **Accesibilidad**: Se proyecta un score en Lighthouse accessibility ≥ 90 (etiquetas correctas, colores con contraste, navegación de teclado).

---

## Anti-patrones (NUNCA HAGAS ESTO)

1. ❌ **NUNCA usar `any` en TypeScript.** Usa genéricos, `unknown` o define la interfaz correcta.
2. ❌ **NUNCA instalar dependencias usando `npm install`.** Utiliza SIEMPRE `pnpm install` o `pnpm add`.
3. ❌ **NUNCA crear APIs sin validación Zod.** Todo input de tRPC o de Express debe pasar por validación de esquemas estricta.
4. ❌ **NUNCA almacenar archivos binarios (BLOBs) en la base de datos.** Sube el archivo a R2 y guarda la URL/Key.
5. ❌ **NUNCA exponer rutas completas del servidor en el cliente** (ni variables de entorno secretas).
6. ❌ **NUNCA usar el prefijo `VITE_` para secretos del backend.** Las variables `VITE_` son incrustadas en el bundle del cliente; úsalas solo para claves públicas.

---
*(Fin del documento SKILL.md)*
