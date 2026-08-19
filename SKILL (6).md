---
name: staging-environment
description: Configuración del entorno de staging, pipeline CI/CD, testing gates y checklist de promoción para PicTik
---

# Habilidad: Staging Environment

Esta habilidad define los estándares, procedimientos y configuraciones requeridos para gestionar los entornos de despliegue en el proyecto PicTik, con especial énfasis en el entorno de Staging (pre-producción) y el pipeline de CI/CD.

## Arquitectura de Entornos de PicTik

PicTik opera con tres entornos principales. Es imperativo que el agente asegure que cada entorno esté completamente aislado para garantizar la seguridad de los datos, la integridad de los pagos y la fiabilidad de las pruebas.

| Entorno | Propósito | Base de datos | Claves Rapyd | Dominio | Almacenamiento |
|---|---|---|---|---|---|
| **Development** | Iteración local | MySQL local / TiDB dev | Sandbox set A | `localhost:5000` | Local filesystem / R2 dev |
| **Staging** | QA y pre-producción | MySQL/TiDB staging separada | Sandbox set B | `staging.pictik.com` | R2 staging bucket |
| **Production** | Usuarios reales | MySQL/TiDB producción | Producción | `pictik.com` | R2 producción bucket |

> [!CAUTION]
> Cada entorno DEBE tener instancias completamente separadas de:
> - Instancias de Base de Datos (nunca compartir DBs entre staging y prod).
> - Claves API de Rapyd (usar diferentes sandbox keys para dev vs staging).
> - Buckets de R2 (nunca compartir almacenamiento).
> - Variables de entorno (archivos `.env`).
> - Gestión de Secretos.

Al configurar o verificar estos entornos, el agente debe validar explícitamente estas separaciones.

## Configuración de Variables de Entorno por Entorno

La configuración de la aplicación debe inyectarse a través de variables de entorno. Estas variables son críticas para asegurar el correcto comportamiento en cada entorno.

Define las siguientes variables necesarias:

- `NODE_ENV`: Debe ser `development`, `staging`, o `production`.
- `DATABASE_URL`: Cadena de conexión MySQL, única por entorno.
- `RAPYD_ACCESS_KEY`, `RAPYD_SECRET_KEY`, `RAPYD_BASE_URL`: Credenciales únicas por entorno. En Staging y Dev DEBEN apuntar al Sandbox de Rapyd.
- `R2_ENDPOINT`, `R2_ACCESS_KEY`, `R2_SECRET_KEY`, `R2_BUCKET`: Credenciales de Cloudflare R2 únicas por entorno.
- `APP_URL`: URL base para callbacks de pagos, webhooks de Rapyd y enlaces de compartición.
- `SESSION_SECRET`: Semilla criptográfica única por entorno.
- `LOG_LEVEL`: Configurado como `debug` (dev), `info` (staging), `warn` (prod).

> [!IMPORTANT]
> **Validación en el arranque**: Todas las variables requeridas DEBEN validarse durante el inicio de la aplicación.
> El archivo `server/_core/env.ts` (usando Zod) debe verificar la existencia y el formato correcto de TODAS las variables listadas anteriormente, fallando (crash) si alguna falta antes de aceptar conexiones.

## Data Masking y Anonimización

Es un riesgo masivo de seguridad y cumplimiento normativo exponer datos de clientes reales en entornos no productivos.

- **NUNCA** copiar datos de producción a staging sin ejecutar un proceso riguroso de anonimización.
- **Emails de usuarios**: Reemplazar con correos generados (ej. `user+staging@pictik.dev`).
- **Nombres de usuarios**: Reemplazar con nombres ficticios (fake names).
- **Fotos**: Utilizar imágenes placeholder o assets de prueba en staging. No usar las fotos reales de los clientes de producción.
- **Datos de pago**: Utilizar exclusivamente datos del sandbox de Rapyd. Nunca usar tarjetas de crédito reales.
- **Direcciones IP**: Ya deben estar hasheadas en `auditLog`, pero verificar que no existan IPs en texto plano en logs de la base de datos de staging.

### Script Template de Anonimización
Si el agente debe escribir un script para migrar/anonimizar datos hacia Staging, debe seguir este patrón:

```typescript
// script de anonimización - ejecutar solo en entorno de migración a staging
import { db } from './db';
import { users } from './schema';
import { faker } from '@faker-js/faker';

async function anonymizeUsers() {
  const allUsers = await db.select().from(users);
  
  for (const user of allUsers) {
    await db.update(users)
      .set({
        email: `anonymized_${user.id}@pictik.dev`,
        name: faker.person.fullName(),
      })
      .where(eq(users.id, user.id));
  }
}
```

## Pipeline CI/CD

El proceso de integración y entrega continua (CI/CD) automatiza el testing y los despliegues. El agente debe estructurar y verificar las siguientes etapas en GitHub Actions (u otro proveedor agnóstico):

### CI (Continuous Integration) — Every PR

Para cada Pull Request, los siguientes pasos son bloqueantes (el merge no debe permitirse si alguno falla):

```yaml
1. Install: pnpm install --frozen-lockfile
2. Types: pnpm check (bloqueante)
3. Lint: eslint --max-warnings 0 (bloqueante)
4. Tests: pnpm test (bloqueante, coverage report - actualmente 30/30 en Vitest)
5. Build: pnpm build (bloqueante, genera artefacto en dist/)
6. Secrets: Escaneo de secretos con Gitleaks o TruffleHog (bloqueante)
7. SAST: Análisis estático de vulnerabilidades con Semgrep o CodeQL (bloqueante)
8. SCA: pnpm audit --audit-level high (bloqueante)
9. Review: invoke recursive-code-review skill (4 passes obligatorios)
```

### CD Staging (Continuous Deployment to Staging) — On merge to main

Cuando un PR es mergeado a `main`, se despliega automáticamente a Staging:

```yaml
1. Validation: Todos los CI gates pasan.
2. Build: Generar artefacto de producción (tarball/zip de dist/ y package.json).
3. Migrations: Ejecutar migraciones de base de datos en la DB de staging (siempre precedido por un backup).
4. Deploy: Desplegar el artefacto al entorno de staging (Hetzner CX22 via SSH) y reiniciar proceso con PM2/systemd.
5. Smoke Tests: Ejecutar tests básicos contra la URL de staging.
6. E2E Tests: Ejecutar batería E2E contra staging.
7. Rapyd: Ejecutar test de integración con el sandbox de Rapyd (checkout flow).
8. Notifications: Notificar al equipo (Slack/Discord) del despliegue en staging.
```

### CD Production — Manual trigger / Release tag

El paso a Producción NUNCA es automático en cada commit. Requiere revisión humana y validaciones adicionales:

```yaml
1. Validation: Todos los tests de staging pasan (Smoke + E2E).
2. Security audit gate: (invoke security-audit skill)
3. Compliance check: (invoke data-privacy-compliance skill)
4. Approval: Aprobación manual requerida (Product Owner / Tech Lead).
5. Backup: Database backup total obligatorio.
6. Migrations: Ejecutar migraciones en la DB de producción.
7. Deploy: Blue/green deployment o rolling deployment (cero downtime).
8. Post-deploy: Smoke tests post-despliegue en producción.
9. Monitoring: Monitorear tasas de error durante los primeros 30 minutos.
10. Rollback: Rollback automático si la tasa de error (HTTP 5xx) excede el umbral tolerado.
```

## Testing Strategy en Staging

En Staging, la estrategia de testing abarca múltiples niveles para simular un entorno productivo real:

1. **Unit tests**: Usa Vitest (validar que los 30/30 tests pasen, cubriendo contratos de tRPC, firmas Rapyd, return routes y checkout).
2. **Integration tests**: Validar los routers de tRPC contra una base de datos de prueba separada, validando operaciones CRUD de galerías.
3. **E2E tests**: Playwright para los flujos críticos de usuario (Critical User Journeys - CUJ):
   - Creación de galerías y subida de fotos (mockeando R2).
   - Selección de suscripciones y el flujo completo de Rapyd checkout.
   - Compartición de galerías y acceso protegido por contraseña.
   - Descarga de fotos (incluyendo la validación obligatoria de marca de agua).
   - Funcionalidad del banner de consentimiento de cookies.
4. **Smoke tests**: Verificar el endpoint de health check (`/api/health`), conectividad a DB, a R2 y a Rapyd API.
5. **Performance tests**: Medir líneas base de tiempo de respuesta (baselines) y simulaciones ligeras de usuarios concurrentes (ej. k6).
6. **Security tests**: Escaneo baseline con OWASP ZAP contra la URL de staging buscando inyecciones y headers faltantes.

## Feature Flags

Para permitir despliegues seguros y graduales, el agente debe implementar y mantener Feature Flags.

- **Uso**: Rollout gradual o dark launching de nuevas funcionalidades (ej. nuevos flujos de pago).
- **Configuración**: Mantenidas en variables de entorno booleanas o un sistema dedicado de configuración en la DB.
- **Patrón en código**:
  ```typescript
  if (isFeatureEnabled('watermarking_v2')) {
    // nueva lógica
  } else {
    // lógica antigua
  }
  ```
- **Limpieza**: Nunca dejar código muerto de feature flags en producción por más de 2 sprints. Si la funcionalidad fue validada y activada al 100%, refactorizar el código para eliminar el flag de inmediato.

## Checklist de Promoción Staging → Producción

El agente debe validar estrictamente este checklist antes de proponer o aprobar una subida a producción:

- [ ] Todos los CI gates de la rama están en verde (green).
- [ ] Los tests E2E han pasado exitosamente sobre el entorno de Staging vivo.
- [ ] Auditoría de seguridad completada (ref: `security-audit` skill).
- [ ] Las líneas base de rendimiento (performance baselines) se mantienen o mejoran.
- [ ] El flujo completo en el Sandbox de Rapyd ha sido verificado de punta a punta en Staging.
- [ ] Verificación de cumplimiento de privacidad superada (ref: `data-privacy-compliance` skill).
- [ ] La migración de la base de datos fue probada primero en Staging sin corrupción de datos.
- [ ] Procedimiento de rollback documentado, entendido y probado.
- [ ] Monitoreo y alertas (monitoring/alerting) correctamente configurados y activos.
- [ ] Aprobación y sign-off del equipo de producto y operaciones obtenida.
- [ ] Notas de la versión (Release notes) preparadas y listas para comunicar.

## Procedimientos de Rollback

En caso de que el despliegue a producción o staging falle, debe ejecutarse un Rollback.

- **Application rollback**: Revertir la imagen de Docker o la versión del artefacto de Vite/esbuild desplegado a la versión anterior estable inmediatamente.
- **Database rollback**: Aplicar las migraciones inversas (`down migrations`). Esto debe haberse testeado exhaustivamente en Staging previamente. Si es destructivo (ej. borra una tabla), preferir restaurar el backup previo.
- **Configuration rollback**: Revertir cualquier variable de entorno a sus valores previos.
- **Rapyd rollback**: N/A, ya que Rapyd es un sistema externo de terceros. Si ocurre un incidente mayor con pagos, deshabilitar la creación de checkouts temporalmente mediante feature flags en lugar de intentar revertir el sistema de pagos externamente.
- **Decisión (Rollback vs. Hotfix)**:
  - Si el impacto es crítico y el fix demora > 15 minutos -> Ejecutar Rollback inmediato.
  - Si el impacto es cosmético o menor -> Preparar un hotfix que pase por todo el CI/CD.
- **Objetivo**: Tiempo máximo de ejecución del rollback (Maximum rollback time target) debe ser **< 5 minutos**.

## Monitoreo de Staging

Staging debe simular los patrones de monitoreo de Producción para encontrar errores antes:

- Endpoint `/api/health` verificado cada 1 minuto (por UptimeKuma o Pingdom).
- Database connectivity check incorporado en el health check.
- R2 connectivity check activo (capacidad para listar y leer objetos de prueba).
- Rapyd API connectivity check (chequeo de ping/autenticación al sandbox).
- Agregación centralizada de logs para el entorno de Staging.
- Monitoreo de la tasa de error global para que los fallos del pipeline no pasen desapercibidos.

## Criterios de Salida

Al implementar, configurar o auditar el entorno de Staging con esta habilidad, el agente debe verificar que:

1. El entorno de Staging es funcionalmente idéntico a Producción (mismo OS - Ubuntu/Hetzner, misma versión de Node.js, mismas dependencias).
2. Todos los pipelines CI/CD están definidos (ej. GitHub Actions yaml scripts) y son completamente funcionales.
3. El despliegue en Staging ocurre automáticamente al hacer merge a la rama `main`.
4. Los tests E2E cubren los User Paths críticos (galerías, pagos con Rapyd, marcas de agua, consentimientos).
5. El Data Masking / Anonimización está implementado; no existe ningún dato de usuario real de producción en la base de datos de staging.
6. El procedimiento de rollback ha sido probado con éxito sin pérdida de información.

## Anti-patrones

Lo que el agente NUNCA DEBE HACER bajo ninguna circunstancia:

- **NUNCA** compartir la misma base de datos entre Staging y Producción.
- **NUNCA** copiar datos de producción hacia staging sin anonimizar los PII (Personally Identifiable Information).
- **NUNCA** saltarse el entorno de staging y desplegar código de dev directamente a producción.
- **NUNCA** ejecutar migraciones de base de datos de naturaleza destructiva (DROP, DELETE masivos, ALTER COLUMN tipo de dato) sin un backup completo (snapshot) tomado minutos antes.
- **NUNCA** utilizar el mismo par de claves API de Rapyd en Staging y Producción, para evitar que pruebas de QA alteren las métricas contables y balances reales.
- **NUNCA** ignorar o desactivar temporalmente ("ya los arreglamos después") los tests fallidos en el CI para forzar un pase verde.
- **NUNCA** aplicar hotfixes mutando archivos directamente en el servidor de producción (via SSH/FTP) sin pasar por el CI/CD y versionamiento en git.
- **NUNCA** configurar staging apuntando a R2, Base de datos o Webhooks reales de producción.
