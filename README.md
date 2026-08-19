# Ecosistema de Skills: PicTik SaaS

Este directorio contiene la inteligencia operativa, reglas de negocio y estándares de seguridad para el equipo de desarrollo (tanto humano como IA) de **PicTik**, una plataforma SaaS de entrega fotográfica.

## 🎯 Propósito

Las *skills* aquí definidas garantizan que todo código escrito, revisado o desplegado para PicTik cumpla con un estándar de oro en ciberseguridad, rendimiento, y normativas de privacidad de datos (GDPR y LATAM).

Al operar sobre este repositorio, el agente de IA lee dinámicamente estas skills para aplicar las mejores prácticas sin depender del conocimiento estático de sus modelos base.

## 📂 Estructura de Skills

El ecosistema está dividido en 4 capas operativas y 1 transversal, compuesto por 10 skills:

| Capa | Skill | Descripción |
|------|-------|-------------|
| **1. Fundamentos** | `fullstack-web-dev` | Decisiones de arquitectura, React 19, tRPC, Vite, y Drizzle ORM. |
| **1. Fundamentos** | `coding-best-practices` | Principios SOLID, Clean Code, TypeScript estricto. |
| **2. Seguridad & Privacidad** | `cybersecurity-gold-standards` | OWASP Top 10, NIST CSF, Headers HTTP y mitigaciones técnicas. |
| **2. Seguridad & Privacidad** | `data-privacy-compliance` | Cumplimiento de GDPR y normativas de LATAM (CO, MX, EC, AR, CL). |
| **3. Integración** | `rapyd-payment-integration` | Integración, testing y paso a producción con la pasarela Rapyd (Hosted Checkout). |
| **4. DevSecOps** | `recursive-code-review` | Protocolo automatizado en 4 pasadas (sintaxis, lógica, seguridad, calidad). |
| **4. DevSecOps** | `staging-environment` | Pipeline de CI/CD, data masking y despliegue a entorno previo. |
| **4. DevSecOps** | `security-audit` | Checklists pre-despliegue (OWASP ASVS), dependency audit y pentesting automatizado. |
| **4. DevSecOps** | `production-deployment` | Despliegue en Hetzner CX22, Cloudflare R2, monitoreo e Incident Response. |
| **Transversal** | `continuous-improvement` | Protocolo de 7 preguntas de cuestionamiento lógico y registro de decisiones (ADR). |

## 🚀 Cómo usar este sistema

### Para Humanos
Si eres un desarrollador, lee la skill correspondiente antes de modificar una pieza crítica del sistema (ej. si vas a tocar pagos, lee `rapyd-payment-integration/SKILL.md`). Cuando debas tomar una decisión técnica que afecte la arquitectura, usa la plantilla de **ADR** definida en `continuous-improvement`.

### Para Agentes IA
- **Antes de escribir código**: Carga las reglas de `fullstack-web-dev` y `coding-best-practices`.
- **Durante la revisión de un PR**: Invoca `recursive-code-review`.
- **Antes de una decisión arquitectónica**: Ejecuta el protocolo de cuestionamiento lógico en `continuous-improvement`.
- **Para preparar un release**: Sigue secuencialmente `staging-environment` → `security-audit` → `production-deployment`.

## 🔒 Reglas de Oro de PicTik

1. **La seguridad no es opcional**: Toda interacción con la DB debe usar Drizzle (nunca raw SQL). Toda entrada debe validarse con Zod. Todo endpoint de pago requiere validación HMAC de Rapyd.
2. **Minimización de Datos**: Solo recopilamos los datos personales estrictamente necesarios. Las fotos son datos biométricos potenciales.
3. **Secreto Absoluto**: NUNCA hardcodear contraseñas. NUNCA inyectar claves privadas (ej. RAPYD_SECRET_KEY) en el build frontend. NUNCA logear IP en texto plano o datos de pago.
4. **Cuestionamiento Constante**: Si una instrucción va en contra de la seguridad o el performance del proyecto, el agente DEBE cuestionarla y proponer la alternativa segura.
