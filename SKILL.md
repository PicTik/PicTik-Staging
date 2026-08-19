---
name: security-audit
description: Skill para ejecutar auditorías de seguridad pre-deployment, penetration testing, verificación de compliance y generación de reportes de auditoría para la plataforma PicTik.
---

# Skill: Security Audit (Auditoría de Seguridad)

Este skill define los procedimientos, listas de verificación y criterios para realizar auditorías de seguridad integrales en PicTik, una plataforma SaaS de entrega de fotos. El objetivo es garantizar que la infraestructura, el código, las dependencias y los procesos cumplan con los estándares más altos de seguridad y privacidad antes de cada despliegue, así como de forma continua.

## Tipos de Auditoría

1. **Continua (por commit)**: Automated checks en cada PR, integrados fuertemente con el skill `recursive-code-review`. Busca vulnerabilidades obvias, secretos expuestos y problemas de linting de seguridad.
2. **Periódica (mensual)**: Comprehensive audit que cubre todas las áreas del sistema, incluyendo revisión de permisos, dependencias y configuraciones de infraestructura.
3. **Pre-deployment**: Gate obligatorio antes de cualquier despliegue a producción. Requiere validación de todas las áreas críticas.
4. **Incident-triggered**: Ejecutada después de un incidente de seguridad, divulgación de vulnerabilidades o un reporte de bug bounty.

## Checklist de Auditoría Pre-deployment (basado en OWASP ASVS)

Esta sección organiza los controles de seguridad en capítulos alineados con el OWASP Application Security Verification Standard (ASVS).

### V1: Architecture & Design
- **Threat Model**: Verificar que el modelo de amenazas esté actualizado y refleje la arquitectura actual de React 19 / Node.js / Drizzle.
- **Security Controls**: Los controles de seguridad principales deben estar debidamente documentados.
- **Trust Boundaries**: Todos los componentes deben tener límites de confianza definidos claramente (ej. entre cliente y servidor tRPC, entre servidor y Cloudflare R2, entre servidor y Rapyd).

### V2: Authentication
- **Password Policy**: Políticas de contraseñas aplicadas (longitud mínima, complejidad).
- **Brute Force Protection**: Mecanismos de rate limiting y bloqueo de cuentas (account lockout) deben estar activos en los endpoints de login.
- **Session Management**: Las cookies de sesión deben tener los flags `Secure`, `HttpOnly`, y `SameSite=Lax/Strict`. Expiración debidamente configurada.
- **MFA Support**: Preparación y soporte para Multi-Factor Authentication habilitados (si aplica o readiness garantizado).

### V3: Session Management
- **Token Predictability**: Los tokens de sesión son generados de forma criptográficamente segura, aleatorios e impredecibles.
- **Invalidation**: La sesión debe invalidarse correctamente tanto en el cliente como en el servidor (base de datos) durante el logout.
- **Timeout**: Timeout de sesión configurado (absoluto e inactivo).
- **Session Fixation**: Verificación de ausencia de vulnerabilidades de fijación de sesión (re-emisión de token tras login exitoso).

### V4: Access Control
- **RBAC Implemented**: Controles de acceso basados en roles implementados correctamente: photographer, client, admin.
- **Gallery Ownership**: La propiedad de la galería debe verificarse criptográficamente o vía base de datos antes de permitir cualquier acceso o modificación.
- **Subscription Limits**: Los límites de los tiers de suscripción deben aplicarse estrictamente en el backend (ej. límite de almacenamiento en Cloudflare R2).
- **Endpoint Protection**: Todos los endpoints tRPC y API expuestos deben estar protegidos por autenticación, a menos que sean explícitamente públicos.
- **No IDOR**: Ausencia de Insecure Direct Object Reference (validación de propiedad/permisos en cada query de Drizzle ORM).

### V5: Input Validation
- **Zod Validation**: Todos los inputs de tRPC deben validarse utilizando esquemas Zod estrictos.
- **File Uploads**: Validación rigurosa de subidas: tipo MIME real (no solo extensión), límite de tamaño y lista blanca de extensiones permitidas.
- **Sanitization**: Parámetros URL y payloads deben ser sanitizados donde corresponda.
- **No Raw SQL**: Ausencia total de consultas SQL crudas. Uso exclusivo de consultas parametrizadas a través de Drizzle ORM.

### V7: Cryptography
- **TLS 1.3**: Uso exclusivo de TLS 1.3 o superior para todas las conexiones de red.
- **Password Hashing**: Las contraseñas deben estar hasheadas utilizando algoritmos robustos como argon2id o bcrypt.
- **No Custom Crypto**: Prohibición estricta de implementaciones criptográficas propias o "caseras".
- **Key Management**: Gestión de claves (API keys de Rapyd, Cloudflare R2) documentada, usando gestores de secretos o variables de entorno protegidas.

### V8: Data Protection
- **Encryption at Rest**: PII (Personal Identifiable Information) encriptada en reposo (ej. discos de base de datos cifrados).
- **No PII in Logs**: Los logs no deben contener PII ni información sensible. Las IPs deben estar hasheadas en el audit log (IP hashing implementado).
- **Data Retention**: Políticas de retención de datos aplicadas correctamente (eliminación automática o manual según se defina).
- **Right to Erasure**: Endpoint y proceso de "Derecho al olvido" / borrado de cuenta funcional.

### V9: Communication Security
- **HTTPS Everywhere**: HSTS (HTTP Strict Transport Security) con directiva preload habilitado.
- **Certificate Validity**: Certificados TLS válidos, sin expirar y con cadena de confianza completa.
- **API TLS**: Todos los endpoints de API (internos y externos) utilizan TLS.
- **Webhook Signatures**: Los endpoints que reciben webhooks (como Rapyd) validan estrictamente las firmas HMAC.

### V10: HTTP Security Headers
- **Content-Security-Policy (CSP)**: Configurada estrictamente para prevenir XSS.
- **Strict-Transport-Security (HSTS)**: `max-age` adecuado y `includeSubDomains`.
- **X-Content-Type-Options**: Configurado como `nosniff`.
- **X-Frame-Options**: Configurado como `DENY` o `SAMEORIGIN`.
- **Referrer-Policy**: Configurado como `strict-origin-when-cross-origin`.
- **Permissions-Policy**: Restringiendo APIs del navegador no utilizadas.

## Penetration Testing Automatizado

- **OWASP ZAP**: Ejecución de baseline scan automatizado contra la aplicación en staging.
- **Nuclei Templates**: Uso de templates de nuclei para buscar vulnerabilidades comunes y exposiciones de configuraciones.
- **Custom Test Scripts (PicTik-specific flows)**:
  - Intento de acceso a galerías sin autenticación válida o contraseña incorrecta.
  - Acceso directo a URLs de fotos (debería requerir siempre presigned URLs desde Cloudflare R2).
  - Intento de fuerza bruta contra la contraseña de una galería protegida.
  - Simulación de webhook spoofing (enviar un payload de Rapyd falso con firma inválida).
  - Parameter tampering durante el proceso de checkout (intento de manipulación de precios).
  - Path traversal durante la subida de archivos (ej. intentar subir archivos como `../../../etc/passwd`).
  - XSS injection en nombres de galerías, descripciones y comentarios (si los hay).

## Auditoría de Headers HTTP y TLS

Las configuraciones web deben someterse a escaneos de herramientas externas para validar posturas de seguridad:
- **Mozilla Observatory**: El escaneo debe tener como target un puntaje de **A+**.
- **SSL Labs**: El escaneo TLS debe tener como target un puntaje de **A+**.
- **SecurityHeaders.com**: Verificar headers y configuraciones.
- **Expected Values**: Verificar que CSP sea restrictiva, HSTS tenga un `max-age` largo, etc.

## Auditoría de Dependencias y Supply Chain

- **`pnpm audit`**: Ejecución en cada CI run. Realizar análisis de severidad de cualquier hallazgo.
- **License Compatibility**: Revisión de licencias para asegurar que ninguna introduzca riesgos legales o requiera open source de código propietario.
- **SBOM Generation**: Generar Software Bill of Materials (formato CycloneDX) antes de releases mayores.
- **Vulnerability Databases**: Verificación contra NVD y GitHub Advisory Database.
- **Maintenance Status**: Revisar la edad de las dependencias y el estado de mantenimiento (reemplazar paquetes abandonados).

## Auditoría de Infraestructura (Hetzner CX22)

- **CIS Benchmark**: Cumplimiento del CIS Benchmark básico para el servidor Linux subyacente.
- **SSH Hardening**: Autenticación exclusiva por clave pública (key-only), bloqueo de acceso root directo, cambio de puerto por defecto.
- **Firewall**: Configuración estricta permitiendo únicamente puertos 80, 443 y el puerto SSH modificado.
- **Fail2ban**: Instalado y configurado adecuadamente para proteger SSH y otros servicios críticos.
- **Automatic Security Updates**: Actualizaciones de seguridad automáticas configuradas para el OS.
- **Node.js Version**: Uso exclusivo de versiones LTS de Node.js, ninguna versión EOL (End of Life).
- **File Permissions**: Permisos restrictivos (ej. `chmod 600` para secretos, el usuario de Node no debe ser root).

## Auditoría de Compliance (GDPR + LATAM)

*(Referenciar el skill `data-privacy-compliance` para mayor profundidad)*
- **Consent Mechanism**: El banner o mecanismo de consentimiento de cookies/tracking debe ser completamente funcional.
- **Privacy Policy**: La política de privacidad debe estar actualizada, accesible y reflejar el uso real de datos.
- **Data Subject Rights**: Endpoints y flujos para ejercer derechos ARCO (Acceso, Rectificación, Cancelación y Oposición) operativos.
- **Data Retention**: Eliminación automática o ofuscación de datos obsoletos en funcionamiento.
- **Breach Notification**: Plan de notificación de brechas de datos documentado y disponible para el equipo.
- **Country-specific Requirements**: Verificación de requerimientos específicos para Colombia, México, Ecuador, Argentina y Chile (CO, MX, EC, AR, CL).

## Auditoría de Pasarela de Pagos (PCI DSS SAQ-A)

*(Referenciar el skill `rapyd-payment-integration`)*
- **No Cardholder Data**: Los sistemas de PicTik no deben procesar, transmitir ni almacenar datos crudos de tarjetas (PAN, CVV).
- **Hosted Checkout**: Uso exclusivo de la página de checkout alojada por Rapyd (hosted checkout) u otra solución compliant SAQ-A.
- **Webhook Signature**: Validación criptográfica activa e irrompible de los webhooks de Rapyd.
- **Sanitized Logs**: Los logs de pagos o depuración no deben contener por accidente ningún dato sensible.
- **TLS**: Todas las comunicaciones de pago (cliente -> Rapyd, servidor -> Rapyd) usan encriptación robusta.
- **SDK Version**: SDK de Rapyd o integraciones de API mantenidas a las versiones más actuales.

## Formato de Reporte de Auditoría

```markdown
# Reporte de Auditoría de Seguridad — PicTik
## Metadata
- Fecha: YYYY-MM-DD
- Tipo: [Pre-deployment | Periódica | Incidente]
- Auditor: [Agent ID / Human]
- Alcance: [Full | Parcial: áreas]

## Resumen Ejecutivo
- Hallazgos totales: N
- Críticos: N | Altos: N | Medios: N | Bajos: N | Info: N
- Estado: [APROBADO | APROBADO CON CONDICIONES | RECHAZADO]

## Hallazgos
| # | CVSS | Severidad | Categoría | Descripción | Evidencia | Remediación | Estado |

## Certificaciones Verificadas
- [ ] OWASP Top 10 mitigated
- [ ] Security headers A+
- [ ] TLS A+
- [ ] Dependencies clean
- [ ] PCI DSS SAQ-A
- [ ] GDPR compliance
- [ ] LATAM privacy laws

## Recomendaciones
[Texto libre para recomendaciones de arquitectura o mejoras a futuro]

## Próxima Auditoría
[Fecha estimada o evento disparador]
```

## CVSS Scoring Guide

Guía simplificada de CVSS v3.1 para clasificar vulnerabilidades en la aplicación web:
- **Critical (9.0-10.0)**: Remote Code Execution (RCE), Inyección SQL con exfiltración de datos, bypass completo de autenticación, acceso no autorizado a todas las galerías.
- **High (7.0-8.9)**: Stored XSS, escalada de privilegios a admin, exposición de datos sensibles masiva (IDOR de alto impacto).
- **Medium (4.0-6.9)**: Reflected XSS, CSRF en acciones no críticas, divulgación de información moderada, bypass de validaciones de cliente (no backend).
- **Low (0.1-3.9)**: Headers HTTP ausentes o débiles (que no resultan en explotación directa), errores de aplicación detallados (stack traces), configuraciones menores débiles.
- **Info (0.0)**: Sugerencias de mejores prácticas, oportunidades de optimización sin impacto directo de seguridad comprobado.

## Frecuencia y Calendario

- **Per commit**: Verificaciones automáticas de seguridad mediante pipelines CI (linting, secrets scanning).
- **Weekly**: Escaneo de vulnerabilidades en dependencias.
- **Monthly**: Reporte completo de auditoría (infraestructura, accesos).
- **Pre-release**: Gate exhaustivo de auditoría obligatorio antes de desplegar a producción.
- **Post-incident**: Auditoría disparada inmediatamente para investigar y contener.

## Criterios de Salida

Para considerar exitosa y completada una auditoría (y por ende aprobar un pase a producción, en su caso):
1. **Reporte Generado**: El reporte de auditoría debe generarse en markdown incluyendo todas las secciones.
2. **Zero CRITICAL/HIGH**: 0 hallazgos abiertos de severidad Crítica o Alta.
3. **Plan para MEDIUM**: Todos los hallazgos Medios deben tener un plan de remediación documentado con una fecha límite (timeline).
4. **Headers A+**: El puntaje de los headers de seguridad en herramientas como Mozilla Observatory debe ser A+.
5. **TLS A+**: El análisis SSL/TLS debe resultar en A+.
6. **Dependencias Limpias**: Ninguna vulnerabilidad alta o crítica identificada por `pnpm audit`.
7. **Compliance Confirmado**: El checklist de compliance, privacidad y PCI DSS SAQ-A debe estar completo sin desviaciones.

## Anti-patrones

- **NUNCA** aprobar o sugerir un despliegue a producción si existen hallazgos de severidad CRITICAL o HIGH abiertos.
- **NUNCA** ejecutar penetration testing activo, fuerza bruta o escaneos destructivos contra el entorno de *producción* sin autorización explícita previa por escrito. Usar entornos de staging/dev.
- **NUNCA** ignorar hallazgos automatizados asumiendo que "no son explotables" sin proveer prueba o evidencia fehaciente documentada.
- **NUNCA** utilizar herramientas de escaneo y auditoría de terceros proveyendo credenciales de producción, datos reales de usuarios en entornos no controlados o compartidos.
- **NUNCA** omitir la sección de auditoría de pagos (PCI DSS) asumiendo que "como usamos Rapyd, ellos se encargan de todo" (el frontend y el manejo de los webhooks es nuestra responsabilidad).
- **NUNCA** postergar la remediación de vulnerabilidades de severidad HIGH por más de un sprint de desarrollo.
- **NUNCA** re-utilizar reportes de auditoría de releases anteriores sin ejecutar y verificar todos los puntos del checklist nuevamente en el release actual.
