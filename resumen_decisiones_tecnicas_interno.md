# PicTik — Resumen técnico interno para decisión de arquitectura

**Autor:** Manus AI  
**Alcance:** revisión exclusiva del código, configuración, pruebas, backlog y documentación incluidos en la copia del proyecto. No se utilizaron fuentes externas.  
**Propósito:** facilitar una discusión de equipo y distinguir lo que ya está implementado de las decisiones que aún requieren confirmación.

> **Actualización de seguridad y pagos:** el estado descrito a continuación incorpora las correcciones verificadas de checkout Rapyd, rutas de retorno, consentimiento analítico, CSP e idempotencia de webhooks. La suite vigente pasa **30/30** pruebas y el checkout de Rapyd Sandbox genera una sesión real.

## Conclusión ejecutiva

PicTik ya cuenta con una base coherente para un SaaS de entrega fotográfica: frontend React con TypeScript, backend Node.js/Express con tRPC, base relacional MySQL/TiDB modelada con Drizzle y un adaptador de pagos Rapyd que mantiene las claves en el servidor. La recomendación principal es **consolidar ese núcleo en lugar de sustituirlo**, y cerrar cuatro decisiones operativas antes de producción: destino de hosting, infraestructura de objetos privados, CI/CD y convención de skills.

| Decisión | Estado observado | Recomendación para cerrar la discusión |
|---|---|---|
| Stack frontend/backend | Implementado y funcional | Mantener React + Vite + TypeScript y Express + tRPC + Zod |
| Base de datos | Implementada como SQL relacional | Mantener MySQL/TiDB + Drizzle; los archivos permanecen fuera de la DB |
| Hosting/cloud | Entorno de desarrollo activo; producción no ratificada | Confirmar Hetzner CX22 como destino de producción y Cloudflare R2 como almacenamiento privado |
| CI/CD | Scripts locales disponibles; no hay pipeline versionado | Añadir CI para `check`, `test` y `build`; definir CD separado y protegido |
| Skills | No existe convención en el repositorio | Adoptar `.agents/skills/` como documentación versionada, no como mecanismo automático implícito |
| Claves Rapyd | Consumo exclusivo del backend, checkout sandbox real y sin fallback simulado | Mantener secretos por variables de entorno administradas por plataforma; nunca usar prefijo `VITE_` |
| Analítica y consentimiento | Script bloqueado antes de consentimiento; carga dinámica tras opt-in | Mantener la carga condicionada y documentar la finalidad analítica |

## 1. Stack tecnológico — ¿Qué framework frontend/backend preferir?

La implementación actual usa **TypeScript de extremo a extremo**. El cliente se apoya en React 19, Vite, Tailwind CSS 4, Wouter, Framer Motion y componentes Radix/Shadcn. El servidor usa Node.js con Express 4; tRPC expone contratos tipados bajo `/api/trpc` y Zod valida las entradas. Drizzle conecta la capa de dominio con MySQL/TiDB. El proceso de imágenes y archivos incorpora Sharp, Archiver y el SDK S3. [1] [2]

> **Decisión recomendada:** conservar el stack actual. La combinación React + TypeScript + tRPC elimina contratos duplicados entre cliente y servidor y está alineada con el código ya desarrollado para galerías, suscripciones, consentimiento y pagos.

| Capa | Implementación observada | Decisión propuesta |
|---|---|---|
| Frontend | React 19, Vite, TypeScript, Tailwind CSS, Wouter | **Mantener**; no hay evidencia interna que justifique una migración a otro framework |
| Backend | Node.js, Express 4, tRPC 11, Zod | **Mantener**; permite APIs tipadas y rutas HTTP específicas como webhooks y archivos |
| Dominio fotográfico | Sharp, Archiver, AWS SDK S3 | **Mantener**, pero completar la migración de almacenamiento privado pendiente |
| Pagos | Adapter Pattern + RapydAdapter | **Mantener**; deja una frontera explícita entre el dominio y la pasarela |

El riesgo principal no es el framework, sino el cierre de componentes de infraestructura que el backlog aún marca como pendientes: bucket privado con URLs prefirmadas, watermarking, cuotas de almacenamiento y preparación de Hetzner. [3] La conversación de equipo debería centrarse en completar esas capacidades y no en cambiar el stack base.

## 2. Base de datos — ¿SQL o NoSQL?

PicTik ya usa una **base de datos SQL relacional**, a través de `mysql2` y Drizzle para el dialecto MySQL. El esquema modela `users`, `galleries`, `photos`, `subscriptions`, `webhookEvents`, `consentRecords` y `auditLog`, con claves foráneas, relaciones y reglas de eliminación que reflejan la propiedad de una galería y de sus fotografías. [1] [4]

La recomendación es mantener **MySQL/TiDB + Drizzle** como sistema transaccional principal. Suscripciones, consentimiento, permisos de descarga, contraseñas de galerías y trazabilidad de acciones requieren relaciones e integridad consistentes. Las fotografías y ZIP no deben convertirse en BLOBs: el esquema ya guarda claves, URLs y metadatos de almacenamiento, no bytes de archivos. [4]

| Componente de datos | Ubicación recomendada | Motivo interno |
|---|---|---|
| Usuarios, galerías, fotos, permisos | MySQL/TiDB | Relaciones explícitas y consulta transaccional |
| Suscripciones, auditoría y consentimiento | MySQL/TiDB | Trazabilidad y control de estado |
| Webhooks procesados | Tabla `webhookEvents` | Idempotencia persistente entre reinicios; el handler rechaza eventos sin identificador |
| Originales, WebP y ZIP | Object storage privado | La tabla `photos` ya está diseñada para referencias y metadatos |

Quedan dos puntos por cerrar: aplicar migraciones de Drizzle de forma determinista en despliegue y conectar la lógica de cuota de almacenamiento ya modelada en `subscriptions` con el bloqueo real de cargas. [1] [3]

## 3. Hosting/Cloud — ¿Dónde se desplegará?

La evidencia interna separa claramente el presente del objetivo. El servidor se ejecuta como aplicación Node empaquetable: `build` genera el cliente con Vite y el servidor con esbuild, mientras que `start` ejecuta `dist/index.js` con `NODE_ENV=production`. El servidor además confía en el primer proxy, con un comentario que menciona un gateway administrado. [1] [2]

Sin embargo, **no existe un destino productivo ratificado en archivos de configuración**. El backlog sí enumera como pendientes tanto la preparación de **Hetzner CX22** como la migración a **Cloudflare R2** con URLs prefirmadas y bucket privado. [3]

> **Propuesta para ratificación:** usar el entorno administrado actual como *staging/preview* y designar Hetzner CX22 como servidor de producción, con Cloudflare R2 privado como capa de objetos. Esta es una recomendación alineada con el backlog, no una infraestructura ya desplegada.

| Entorno | Estado interno | Propuesta operativa |
|---|---|---|
| Desarrollo / preview | Activo en el proyecto actual | Mantener para iteración, QA y pruebas de sandbox |
| Staging | No formalizado | Separar variables, dominio y base de datos de producción |
| Producción de aplicación | Pendiente; Hetzner CX22 aparece en backlog | Confirmar VM, proxy inverso/TLS, estrategia de reinicio y observabilidad |
| Almacenamiento multimedia | Pendiente; R2 privado aparece en backlog | Implementar bucket privado, claves de objeto y URLs prefirmadas antes de migrar tráfico real |

La pregunta que se debe cerrar es binaria: **¿el equipo ratifica Hetzner CX22 como producción?** Si la respuesta es sí, el siguiente entregable debe ser una guía de despliegue reproducible, no un despliegue manual.

## 4. CI/CD — ¿Qué pipeline se usa?

Actualmente el repositorio dispone de las piezas de calidad como scripts manuales: `pnpm check` para TypeScript, `pnpm test` para Vitest, `pnpm build` para el artefacto de producción y `pnpm db:push` para generar y aplicar migraciones de Drizzle. [1] La revisión de estructura no encontró un flujo de CI versionado bajo `.github/workflows/` ni equivalente.

La recomendación es adoptar el siguiente pipeline mínimo, implementado como configuración versionada del repositorio:

| Etapa | Comando del repositorio | Condición sugerida |
|---|---|---|
| Instalación | `pnpm install --frozen-lockfile` | Cada PR y push a la rama principal |
| Tipos | `pnpm check` | Bloqueante |
| Pruebas | `pnpm test` | Bloqueante |
| Build | `pnpm build` | Bloqueante |
| Migración | Proceso separado y protegido | Sólo tras aprobación de despliegue y copia de respaldo |
| Despliegue | Publicar artefacto y reiniciar servicio | Sólo desde rama protegida / release aprobada |

La migración de base de datos no debería ejecutarse automáticamente en cada pull request. La propuesta es validarla en CI cuando exista una base efímera y ejecutarla en CD sólo para el entorno autorizado. Esta separación reduce el riesgo de aplicar cambios de esquema sobre el destino equivocado. La suite de pruebas actual ya cubre contratos del servidor, firma/errores de Rapyd, rutas de retorno y un flujo de interfaz que recorre selección de plan, autenticación simulada y apertura automática del checkout. [1] [7]

## 5. Ubicación de las skills — ¿`.agents/skills/` en el workspace está bien?

La copia actual no contiene `.agents/` ni documenta una convención de skills. [5] Por ello, `.agents/skills/` **es una buena convención propuesta de repositorio**, siempre que se entienda como documentación versionada y no como un mecanismo de ejecución automática no demostrado por el código.

Una estructura sugerida es la siguiente:

```text
.agents/
  README.md
  skills/
    rapyd-payments/SKILL.md
    gallery-storage/SKILL.md
    privacy-compliance/SKILL.md
    release-checklist/SKILL.md
```

| Elemento | Contenido recomendado |
|---|---|
| `.agents/README.md` | Propósito, responsables, reglas de actualización y cómo elegir un skill |
| `SKILL.md` | Objetivo, alcance, restricciones, archivos fuente, validaciones y criterios de salida |
| Skills de Rapyd | Firma, webhooks, idempotencia, pruebas de sandbox y qué nunca enviar al cliente |
| Skills de almacenamiento | R2, privacidad, URLs prefirmadas, WebP, watermarking y cuotas |
| Skills de release | Pruebas, migraciones, respaldo, variables necesarias y rollback |

El equipo debe designar un responsable de actualizar cada skill cuando cambien `drizzle/schema.ts`, `server/payments/rapyd.ts` o el flujo de despliegue. Sin esa propiedad, la carpeta se convertirá en documentación desactualizada.

## 6. Keys de Rapyd — ¿Variables de entorno u otro mecanismo?

Las claves se consumen exclusivamente en el backend mediante `RAPYD_ACCESS_KEY`, `RAPYD_SECRET_KEY` y `RAPYD_BASE_URL`, mapeadas desde `process.env` en `server/_core/env.ts`. `RapydAdapter` usa esas claves para firmar solicitudes, añade una clave de idempotencia por solicitud y valida webhooks; el cliente recibe exclusivamente una `redirectUrl` mediante tRPC y no tiene una ruta de acceso a las claves. [2] [6] [7]

> **Decisión recomendada:** mantener las claves de Rapyd como variables de entorno inyectadas por el gestor de secretos de cada entorno. No deben incluir el prefijo `VITE_`, no deben estar en código, no deben entrar en `localStorage`, ni deben aparecer en registros.

| Entorno | Variables | Regla |
|---|---|---|
| Desarrollo local | `RAPYD_ACCESS_KEY`, `RAPYD_SECRET_KEY`, `RAPYD_BASE_URL` de sandbox | Archivo local excluido de control de versiones o gestor de secretos del entorno |
| CI | Sólo las credenciales estrictamente necesarias para pruebas sandbox autorizadas | Secretos del proveedor de CI; nunca argumentos de línea de comandos |
| Staging | Credenciales sandbox separadas | Rotación independiente de desarrollo |
| Producción | Credenciales productivas separadas | Acceso mínimo, rotación definida y registro de cambios |

El comportamiento vigente corrige dos riesgos previos. Primero, el handler persiste los IDs procesados en `webhookEvents` y responde con error temporal si no puede registrar el evento de forma segura; así no confirma un pago sin trazabilidad. Segundo, el adaptador ya no redirige a una sesión simulada cuando faltan claves o Rapyd rechaza un payload: registra un mensaje técnico sin secretos y devuelve un error controlado al cliente. Las rutas de retorno se limitan a `/payment/status` para éxito y `/checkout` para cancelación, evitando la ruta inexistente `/dashboard/billing`. [7] [8]

Quedan como decisiones operativas la rotación documentada de credenciales, el uso de valores diferentes de sandbox por entorno y la monitorización de errores de la pasarela sin introducir datos de pago ni secretos en registros.

## 7. Protección de datos y ciberseguridad — actualización de controles

Las correcciones preservan un modelo de minimización de datos: la analítica no se carga de forma estática en el HTML y sólo se inyecta después de que la persona usuaria active la categoría analítica en el banner de consentimiento. El cambio de preferencias genera un evento local para cargar o retirar el script; por ello, la CSP permite el dominio configurado pero no fuerza una transmisión antes del opt-in. [11] [12] [13]

| Control | Estado actual | Relevancia para el producto |
|---|---|---|
| Consentimiento analítico | Opt-in explícito antes de inyectar el script | Reduce tratamiento no necesario de datos de navegación |
| CSP | Restringe scripts, conexiones, formularios, marcos y recursos a orígenes definidos | Disminuye superficie de inyección y exfiltración |
| Datos de tarjeta | Checkout alojado por Rapyd; PicTik sólo recibe URL de redirección y eventos | Evita tratar números de tarjeta en el servidor de PicTik |
| Webhooks | Firma HMAC, comparación resistente al tiempo e idempotencia persistente | Reduce suplantación y doble procesamiento de eventos de pago |
| Auditoría | Se registra creación de checkout con IP transformada en hash | Mantiene trazabilidad sin conservar la IP en claro |

> **Criterio de continuidad:** los siguientes cambios de infraestructura —R2, watermarking, cuotas y despliegue— deben conservar el mismo patrón: acceso mínimo, bucket privado, URLs temporales, no exponer secretos al cliente, retención limitada y trazabilidad proporcional.

## Decisiones que conviene aprobar en la reunión

| Prioridad | Decisión a aprobar | Resultado esperado |
|---|---|---|
| Alta | Ratificar MySQL/TiDB + Drizzle como sistema transaccional | Evitar debates de migración a NoSQL sin necesidad funcional |
| Alta | Ratificar Hetzner CX22 + Cloudflare R2 privado como objetivo productivo, o sustituirlo formalmente | Poder diseñar CD, dominios, secretos y operación |
| Alta | Adoptar CI mínimo: check, test y build en cada PR | Reducir regresiones antes del despliegue |
| Alta | Mantener claves Rapyd sólo en secretos del backend | Evitar exposición de credenciales y firmas al navegador; el fallback simulado ya no está permitido |
| Media | Adoptar `.agents/skills/` como convención documentada | Concentrar conocimiento operativo sin mezclarlo con código de producción |
| Media | Conectar cuotas de almacenamiento a la lógica de producción | El procesamiento de webhooks ya persiste idempotencia; queda bloquear cargas al exceder el plan |

## Referencias internas

[1]: ../package.json "Dependencias y scripts del proyecto"
[2]: ../server/_core/index.ts "Arranque de Express, middleware y tRPC"
[3]: ../todo.md "Backlog de infraestructura y funcionalidades pendientes"
[4]: ../drizzle/schema.ts "Esquema relacional y relaciones de datos"
[5]: ../docs/README.md "Documentación técnica interna disponible"
[6]: ../server/_core/env.ts "Mapeo de variables de entorno de Rapyd"
[7]: ../server/payments/rapyd.ts "Adaptador Rapyd y firma de solicitudes"
[8]: ../server/webhooks/rapyd.ts "Receptor de webhooks e idempotencia actual"
[9]: payment-flow.md "Flujo de checkout y webhook documentado"
[10]: security-measures.md "Medidas de seguridad documentadas"
[11]: ../server/middleware/security.ts "Cabeceras de seguridad y CSP"
[12]: ../client/src/components/AnalyticsConsentScript.tsx "Carga de analítica posterior al consentimiento"
[13]: ../client/src/components/CookieBanner.tsx "Registro y actualización de consentimiento de cookies"
