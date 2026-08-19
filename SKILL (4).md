---
name: production-deployment
description: Guía exhaustiva para el despliegue en producción de PicTik en infraestructura Hetzner CX22, configuración de almacenamiento Cloudflare R2, monitoreo, respuesta a incidentes y recuperación ante desastres.
---

# Habilidad: Despliegue en Producción (Production Deployment)

Esta habilidad proporciona las instrucciones detalladas para preparar, ejecutar y monitorear el despliegue en producción de PicTik utilizando un servidor Hetzner CX22 y Cloudflare R2 como almacenamiento principal. 

Sigue estas directrices estrictamente para garantizar la seguridad, disponibilidad y resiliencia de la plataforma.

## Arquitectura de Producción

La infraestructura de producción objetivo se compone de los siguientes elementos:

- **Hetzner CX22**: Servidor principal de aplicaciones.
  - Especificaciones: 2 vCPU, 4GB RAM, 40GB NVMe SSD.
  - Sistema Operativo: Ubuntu 22.04 LTS (o la versión LTS más reciente).
  - Entorno de Ejecución: Node.js versión LTS gestionado mediante `nvm`.
  - Process Manager: PM2 o `systemd` para mantener los procesos activos.
  - Reverse Proxy: Nginx o Caddy para TLS termination y enrutamiento.
- **Cloudflare R2**: Almacenamiento de objetos compatible con S3.
  - Bucket privado para los archivos originales (sin acceso público directo).
  - Generación de Presigned URLs para acceso temporal de usuarios autorizados.
  - Encriptación del lado del servidor (Server-side encryption) activada.
- **Base de Datos (MySQL/TiDB)**: Instancia de producción.
  - Estrictamente separada del entorno de staging.
  - Respaldos (backups) automatizados diarios.
- **Cloudflare Edge**:
  - Gestión de DNS, CDN y protección contra ataques DDoS.
- **Rapyd**:
  - Configuración con claves de API de Producción reales.

## Checklist Pre-producción

Este checklist DEBE completarse de manera obligatoria y aprobar todos sus puntos antes de iniciar cualquier proceso de despliegue a producción.

### Código y Build
- [ ] Todos los gates de CI en verde (tipos estritos, linter sin warnings, tests en 30/30, build exitoso, auditoría de paquetes).
- [ ] Revisión de código recursiva de 4 pasadas completada (referencia: `recursive-code-review`).
- [ ] No existen etiquetas TODO/FIXME en el código que no tengan una referencia a un ticket activo.
- [ ] La versión del proyecto ha sido actualizada según Semantic Versioning (semver).
- [ ] El archivo CHANGELOG ha sido actualizado con los últimos cambios.

### Seguridad
- [ ] Auditoría de seguridad superada con éxito (referencia: `security-audit`).
- [ ] Cero (0) vulnerabilidades de criticidad CRITICAL o HIGH identificadas.
- [ ] Cabeceras de seguridad configuradas (CSP, HSTS, X-Frame-Options, X-Content-Type-Options).
- [ ] Certificado TLS 1.3 configurado y válido.
- [ ] Se han rotado los secretos en caso de ser necesario según política.
- [ ] Ejecución de `pnpm audit` finalizada sin incidencias críticas.

### Compliance
- [ ] Política de privacidad actualizada y aprobada (referencia: `data-privacy-compliance`).
- [ ] El banner de consentimiento (Consent banner) funciona correctamente.
- [ ] Las políticas de retención de datos están automatizadas e implementadas.
- [ ] Los requerimientos específicos de GDPR y las normativas de LATAM están verificados.

### Pagos
- [ ] Claves de producción de Rapyd configuradas de forma segura (referencia: `rapyd-payment-integration`).
- [ ] La URL del webhook está actualizada al dominio real de producción.
- [ ] Se ha realizado y validado al menos una transacción de prueba.
- [ ] El proceso de reconciliación de pagos está documentado.

### Infraestructura
- [ ] El servidor está endurecido (SSH securizado, firewall configurado, fail2ban activo).
- [ ] Los sistemas de monitoreo están configurados y reportando.
- [ ] La infraestructura de logging (centralizado) está activa.
- [ ] Los respaldos (backups) están configurados y se ha probado su restauración.
- [ ] El procedimiento de rollback se ha probado exitosamente en staging.
- [ ] Los registros DNS están correctamente configurados.

### Base de Datos
- [ ] Las migraciones han sido revisadas y preparadas para aplicarse a la DB de producción.
- [ ] Se ha tomado y validado un respaldo (backup) justo antes de aplicar la migración.
- [ ] El connection pooling está optimizado y configurado correctamente.
- [ ] El endpoint de health check funciona y verifica el estado de la conexión a la base de datos.

## Hardening del Servidor Hetzner CX22

Para asegurar el servidor Hetzner CX22, debes aplicar la siguiente guía de hardening detallada.

### SSH
- Deshabilita por completo el acceso del usuario root (`PermitRootLogin no`).
- Fuerza la autenticación exclusivamente mediante pares de claves (deshabilita la autenticación por contraseña).
- Cambia el puerto SSH por defecto (22) a un puerto no estándar.
- Utiliza claves de tipo ED25519; rechaza DSA y RSA antiguos.
- Configura e instala `fail2ban` para proteger el puerto SSH contra ataques de fuerza bruta.

### Firewall (ufw/iptables)
- Permite tráfico entrante únicamente en los puertos: 80 (HTTP), 443 (HTTPS) y el nuevo puerto configurado para SSH.
- Bloquea (Deny) todo el resto del tráfico entrante de manera predeterminada.
- Configura el firewall para registrar (log) las conexiones denegadas.

### OS Hardening
- Habilita las actualizaciones de seguridad automáticas (`unattended-upgrades`).
- Desinstala y elimina todos los paquetes y dependencias innecesarios.
- Deshabilita cualquier servicio que no sea utilizado por PicTik.
- Configura la rotación de logs (logrotate) para evitar llenar el disco duro.
- Aplica el principio de mínimo privilegio en los permisos de archivos y directorios.
- Configura memoria swap (altamente recomendado dado que el servidor cuenta con 4GB de RAM).

### Node.js Security
- Ejecuta la aplicación siempre con un usuario sin privilegios administrativos (ej., usuario `pictik`). NUNCA como root.
- Utiliza PM2 o `systemd` para establecer límites de memoria máxima para el proceso.
- Define la variable de entorno `NODE_ENV=production`.
- Deshabilita la cabecera HTTP `X-Powered-By` en Express.
- Configura `trust proxy` en Express para permitir que reciba correctamente la IP del cliente detrás del proxy inverso Nginx/Caddy.

## Configuración de Reverse Proxy (Nginx/Caddy)

El proxy inverso debe actuar como la principal barrera de entrada al servidor. Configúralo para:
- Realizar terminación TLS (TLS termination) utilizando certificados de Let's Encrypt.
- Forzar la redirección automática de tráfico HTTP a HTTPS.
- Realizar Proxy Pass del tráfico hacia la aplicación Node.js interna.
- Soportar WebSockets (mediante las cabeceras `Upgrade` y `Connection`) si es requerido por tRPC o componentes en tiempo real.
- Inyectar de manera obligatoria las cabeceras de seguridad.
- Implementar rate limiting por IP para proteger las APIs.
- Habilitar la compresión Gzip o Brotli para los assets estáticos y las respuestas JSON.
- Servir los archivos estáticos generados por el build del cliente (Vite).
- Limitar el tamaño máximo del payload y subidas de archivos en la configuración.

## HTTPS y Certificados TLS

La seguridad en tránsito es crítica:
- Implementa Let's Encrypt con un proceso de auto-renovación mediante `certbot` o de forma automática si utilizas Caddy.
- Habilita Strict Transport Security (HSTS) e incluye la directiva `preload`.
- Configura el servidor para aceptar ÚNICAMENTE TLS 1.3 (deshabilita de manera explícita TLS 1.0, 1.1 y 1.2).
- Utiliza las cipher suites más robustas disponibles.
- Activa OCSP stapling para mejorar el rendimiento de las conexiones seguras.
- Establece un monitoreo de la expiración del certificado para alertar 14 días antes del vencimiento.

## Configuración de Cloudflare R2

Para el almacenamiento de fotografías (activos fundamentales de PicTik):
- Crea un bucket dedicado de producción y asegúrate de que sea estrictamente PRIVADO.
- Configura claves de acceso (Access Keys) con permisos limitados y alójalas en el servidor de forma segura.
- La aplicación debe generar Presigned URLs para que el cliente pueda acceder a las fotografías.
- La expiración (expiry) de la URL debe ser configurable dependiendo del nivel de suscripción del usuario.
- Activa el Server-side encryption en el bucket.
- Configura correctamente las reglas de CORS si se permiten subidas directas desde el cliente.
- Implementa Lifecycle rules en R2 para eliminar de forma automática archivos huérfanos o temporales.

## Estrategia de Despliegue

Sigue una estrategia de despliegue que minimice la interrupción del servicio:
- Se prefiere Blue/Green deployment o, en su defecto, un Rolling update gestionado por PM2.
- **Procedimiento Zero-downtime deployment**:
  1. Construye el nuevo artefacto (build) en CI/local.
  2. Sube el artefacto al servidor Hetzner.
  3. Ejecuta las migraciones de base de datos (después de validar el backup de la BD).
  4. Cambia el tráfico gradualmente a la nueva versión (reiniciando los workers mediante el modo cluster de PM2).
  5. Monitorea los errores, tráfico y logs intensivamente durante 30 minutos.
  6. Elimina la versión antigua una vez confirmada la estabilidad de la nueva versión.
- Emplea Canary deployment si el cambio introduce altos riesgos o modificaciones a los flujos de pago.
- Utiliza Feature flags para habilitar nuevas funcionalidades progresivamente.

## Migración Rapyd Sandbox → Producción

*(Referencia: habilidad `rapyd-payment-integration`)*
Durante el paso final a producción:
- Reemplaza de forma segura todas las claves Sandbox por claves de API de Producción.
- Actualiza la variable `RAPYD_BASE_URL` apuntando a `https://api.rapyd.net`.
- Actualiza la URL del webhook en el panel de Rapyd para apuntar al dominio real.
- Asegúrate de validar la firma HMAC del webhook utilizando las claves de producción.
- Ejecuta y verifica una transacción real de bajo monto.
- Mantén monitoreo estricto de los logs de la pasarela de pagos las primeras 48 horas.
- Configura alertas inmediatas para fallos en las confirmaciones de pago.

## Monitoring y Alerting

La observabilidad es un pilar fundamental en producción. Divide el monitoreo en:
- **Application monitoring**: tasas de errores HTTP 5xx, tiempos de respuesta (latencia), consumo de memoria, utilización de CPU.
- **Infrastructure monitoring**: espacio disponible en disco (NVMe), tráfico de red, estado de los procesos clave (PM2/systemd).
- **Business monitoring**: registro de usuarios nuevos, confirmación de pagos, creación de galerías, cargas de fotos completadas.
- **Security monitoring**: intentos de inicio de sesión fallidos, peticiones bloqueadas por WAF, anomalías de red.

**Herramientas y Canales**:
- Se puede usar Prometheus + Grafana, Uptime Kuma o soluciones comerciales (Datadog, New Relic).
- Los canales de alerta deben ser: Email, Slack/Discord e integraciones con PagerDuty para on-call.

**Umbrales de alerta (Thresholds)**:
- Error rate > 5% → WARNING
- Error rate > 15% → CRITICAL
- Response time p95 > 2s → WARNING
- Utilización de Disco > 80% → WARNING
- Consumo de Memoria > 85% → WARNING

## Logging Centralizado

- Los logs deben estar en formato JSON estructurado utilizando librerías como `pino` o `winston`.
- Define y respeta los niveles: `error`, `warn`, `info`, `debug`.
- En el entorno de Producción, el nivel mínimo a registrar es `info`.
- **Redacción de PII (Personally Identifiable Information)**: ESTRICTAMENTE PROHIBIDO registrar correos electrónicos, contraseñas, datos de tarjetas de crédito o IPs completas. Deben ser ofuscados o enmascarados antes del log.
- **Audit trail**: Registra siempre las acciones críticas de negocio en la tabla `auditLog` (con ofuscación).
- Retención: Almacenar los logs durante un mínimo de 90 días.
- Rotación: Diaria y con compresión activada.

## Backup y Disaster Recovery

Implementa las siguientes políticas para salvaguardar los datos:
- **Base de Datos**: Habilitar Point-In-Time Recovery (PITR) con archivado continuo de logs transaccionales (WAL). Respaldos completos (snapshots) automatizados todos los días, con un período de retención mínimo de 30 días.
- **Cloudflare R2**: Habilita el control de versiones (versioning) para prevenir borrados accidentales. Opcionalmente, configura replicación cross-region.
- **Configuración**: Todos los archivos de configuración deben estar versionados en el repositorio, y los secretos almacenados en un gestor de secretos (vault).
- **RPO (Recovery Point Objective)**: **< 5 minutos** de pérdida de datos aceptable, justificado por la criticidad de las transacciones de Rapyd.
- **RTO (Recovery Time Objective)**: Tiempo de recuperación total de los servicios en menos de 4 horas tras un incidente grave.
- Realiza pruebas mensuales de restauración para verificar que los backups sean íntegros.
- Documenta explícitamente y mantén actualizado el procedimiento de Disaster Recovery.

## WAF y Protección DDoS

Usa la capa de Cloudflare (Edge) para proteger la infraestructura:
- Configura reglas de WAF en Cloudflare específicas para mitigar inyecciones y ataques comunes.
- Habilita el rate limiting en el Edge.
- Activa las funciones de Bot Management.
- Verifica que la mitigación automática contra DDoS de Cloudflare se encuentre operativa.
- Utiliza la reputación de IPs para bloquear tráfico malicioso.
- Implementa restricciones geográficas si es aplicable a las áreas de negocio objetivo.

## Incident Response Plan

Frente a un incidente en producción, se deben seguir estos pasos secuenciales:
0. **Preparación**: Documentación, runbooks, matriz de contactos y accesos (pre-aprobados) listos antes del incidente.
1. **Detección**: Identificación a través de alertas del sistema, reportes de usuarios o escaneos de seguridad.
2. **Clasificación**: Determinar la severidad del incidente, clasificándolo de SEV1 a SEV4.
3. **Contención**: Aislar la infraestructura afectada de inmediato y bloquear los vectores de ataque explotados.
4. **Erradicación**: Resolver la causa raíz y desplegar parches o hotfixes pertinentes.
5. **Recuperación**: Restaurar los servicios afectados a su operación normal y validar la integridad total de los datos.
6. **Post-mortem**: Elaborar un documento sin culpas que contenga la línea de tiempo, la causa raíz, lecciones aprendidas y los elementos de acción a seguir.

**Notificaciones de brecha de datos (Breach notification)**: 
- 72h como máximo a la autoridad pertinente si hay usuarios europeos (GDPR).
- Notificación tan pronto como sea posible (ASAP) a los usuarios afectados si hay riesgo alto.
- Cumplimiento estricto con las notificaciones exigidas por las autoridades LATAM según corresponda al país.

## Post-deployment Validation

Inmediatamente tras un despliegue en producción, ejecuta las siguientes validaciones:
- Ejecuta los smoke tests sobre los endpoints de producción.
- Prueba integral end-to-end del flujo de pago (transacción en vivo o tarjeta de prueba habilitada).
- Validación de creación de galerías, subida de imagen y generación de enlace para acceder (Presigned URLs).
- Test del funcionamiento correcto del banner de consentimiento de cookies.
- Verificación exhaustiva de inyección de las cabeceras de seguridad.
- Verificación de validez e integridad del certificado TLS.
- Monitoreo minucioso de tasas de error y rendimiento por al menos 30 minutos posteriores al despliegue.

## Criterios de Salida

Un despliegue a producción se considera concluido y exitoso únicamente cuando:
- El servidor está correctamente endurecido (hardened) y todos los controles de seguridad se encuentran activos.
- El escaneo en SSL Labs reporta grado A+ para la configuración TLS.
- El monitoreo de aplicaciones e infraestructura y sus sistemas de alerta están 100% operativos.
- Los backups han sido configurados y probada su restauración exitosamente.
- El procedimiento de rollback ha sido probado y documentado.
- El plan de respuesta a incidentes está documentado y accesible.
- El flujo de producción de Rapyd ha sido verificado con éxito y está recibiendo confirmaciones reales.
- Existen cero (0) hallazgos de severidad CRITICAL en la auditoría de seguridad previa al despliegue.

## Anti-patrones

NUNCA hagas lo siguiente bajo ninguna circunstancia:
- NUNCA desplegar a producción sin haber pasado los cambios y pruebas previamente por staging.
- NUNCA editar archivos o código directamente en el servidor de producción (por ejemplo, vía vi/nano).
- NUNCA ejecutar la aplicación Node.js como el usuario `root`.
- NUNCA almacenar secretos, tokens o contraseñas en el código fuente o en archivos en texto plano dentro del servidor.
- NUNCA deshabilitar la redirección a HTTPS o los certificados de forma "temporal".
- NUNCA ignorar las alertas de los sistemas de monitoring, incluso si parecen falsos positivos; siempre investiga.
- NUNCA realizar un rollback sin antes verificar detalladamente la integridad y consistencia de los datos en la base de datos.
- NUNCA desplegar una migración de base de datos sin tomar un backup instantes antes.
- NUNCA habilitar el inicio de sesión SSH con contraseñas (usar siempre claves asimétricas).
- NUNCA mantener expuestos puertos innecesarios, de base de datos, o de testeo en el firewall público.
- NUNCA mezclar o confundir claves de sandbox y producción de la API de Rapyd.
