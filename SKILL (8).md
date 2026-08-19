---
name: coding-best-practices
description: Define y aplica los estándares de código limpio, principios SOLID, reglas de TypeScript estricto y el framework de cuestionamiento lógico para tomar decisiones de arquitectura en PicTik.
---

# 🧠 Coding Best Practices & Logical Framework

Este archivo define las reglas fundamentales de ingeniería de software, arquitectura de código y toma de decisiones para PicTik. Todo agente, sub-agente o desarrollador debe adherirse estrictamente a estas pautas para garantizar un código mantenible, escalable, seguro y libre de deuda técnica técnica.

---

## 1. Principios Fundamentales

### SOLID Aplicado a TypeScript / React / Node.js
- **S (Single Responsibility Principle):** Un componente de React debe tener una única responsabilidad (UI, lógica, o layout). Un procedimiento de tRPC (`tRPC procedure`) debe realizar una sola operación de negocio.
- **O (Open/Closed Principle):** Utilizar el **Adapter Pattern** para integraciones externas. Por ejemplo, `RapydAdapter` para pagos. Si cambia el proveedor, el sistema está abierto a la extensión (nuevo Adapter) pero cerrado a la modificación de la lógica core.
- **L (Liskov Substitution Principle):** Respetar los contratos de interfaces mediante schemas de Zod. Cualquier implementación que cumpla con la interfaz puede sustituir a otra.
- **I (Interface Segregation Principle):** Crear routers de tRPC granulares en lugar de monolíticos. Por ejemplo, separar `usersRouter`, `galleriesRouter`, `paymentsRouter` en lugar de un único `appRouter` inflado.
- **D (Dependency Inversion Principle):** Aplicar inyección de dependencias para servicios y adaptadores, lo que facilita el testing (mocks/stubs).

### Otros Principios Core
- **DRY (Don't Repeat Yourself):** Compartir tipos entre cliente y servidor mediante la inferencia de tRPC (`tRPC inference`). Evitar duplicación de interfaces.
- **KISS (Keep It Simple, Stupid):** Preferir soluciones simples. Evitar la sobre-ingeniería. Si un problema se resuelve con una función simple, no crear una jerarquía de clases.
- **YAGNI (You Aren't Gonna Need It):** No construir funcionalidades o abstracciones que no estén explícitamente en el backlog o requerimientos actuales.

---

## 2. Framework de Cuestionamiento Lógico

Antes de implementar CUALQUIER decisión arquitectónica, patrón de diseño, o cambio de librería, el agente DEBE responder explícitamente al siguiente cuestionario (Checkpoint Pattern).

### Formato de Decisión Lógica (Decision Template)
Cada propuesta arquitectónica importante debe ir acompañada de este bloque rellenado:

1. **¿Por qué esta solución y no otra?**
   - *Consideración A:* [Pros/Cons]
   - *Consideración B:* [Pros/Cons]
   - *Razón de la elección:* ...
2. **¿Qué trade-offs implica?**
   - *Rendimiento (Performance):* ...
   - *Complejidad (Complexity):* ...
   - *Seguridad (Security):* ...
   - *Mantenibilidad (Maintainability):* ...
3. **¿Cumple con los estándares de seguridad?**
   - *(Referenciar la skill `cybersecurity-gold-standards` y verificar: inyección SQL, XSS, autenticación, autorización).*
4. **¿Es escalable para el crecimiento esperado de PicTik?**
   - *(Considerar el modelo de base de datos, carga en la red, y tamaño del bundle en el cliente).*
5. **¿Hay impacto en compliance de datos personales?**
   - *(Referenciar la skill `data-privacy-compliance` y asegurar el manejo de Consent Records o PII).*
6. **¿Es coherente con los patrones existentes en el codebase?**
   - *(¿Sigue las convenciones actuales o introduce un nuevo paradigma innecesario?)*
7. **¿Se puede testear de forma aislada?**
   - *(¿La solución permite unit tests rápidos e independientes?)*

---

## 3. Clean Code para PicTik

### Convenciones de Nomenclatura (Naming Conventions)
- **Variables y Funciones:** `camelCase` (ej: `getUserData`, `isModalOpen`).
- **Componentes React, Clases, y Tipos/Interfaces:** `PascalCase` (ej: `PhotoGallery`, `PaymentAdapter`, `UserProfile`).
- **Variables de Entorno y Constantes Globales:** `SCREAMING_SNAKE_CASE` (ej: `API_BASE_URL`, `MAX_FILE_SIZE`).
- **Booleanos:** Usar prefijos como `is`, `has`, `should` (ej: `isActive`, `hasSubscription`).

### Restricciones de Tamaño
- **Tamaño de Función:** Máximo 30 líneas de código. Si es más grande, extraer lógica en funciones auxiliares (helper functions).
- **Tamaño de Archivo:** Máximo 300 líneas. Si un archivo supera este límite, dividirlo (ej: extraer sub-componentes, hooks personalizados, o utilidades).
- **Complejidad Ciclomática:** Máximo 10. Evitar múltiples `if/else` anidados. Preferir el uso de diccionarios, guard clauses o Strategy Pattern.

### Comentarios y Mensajes
- **Comentarios:** Documentar el POR QUÉ (WHY), nunca el QUÉ (WHAT). El código debe ser autodocumentado (self-documenting).
- **Mensajes de Error:**
  - Los errores dirigidos al usuario (user-facing) deben estar en español (ej: "No se pudo procesar tu pago. Inténtalo de nuevo.").
  - Los logs técnicos del backend deben estar en inglés para facilitar el debuggeo (ej: "Failed to initialize Rapyd Collect checkout").

---

## 4. TypeScript Strict Mode Rules

El proyecto utiliza las configuraciones más estrictas de TypeScript. Estas reglas son innegociables:

- **Configuración `tsconfig.json`:**
  - `"strict": true`
  - `"noUncheckedIndexedAccess": true`
  - `"exactOptionalPropertyTypes": true`
- **Zod como Single Source of Truth:**
  - Los esquemas de Zod definen la estructura.
  - Generar tipos a partir de Zod usando `z.infer<typeof Schema>`. NUNCA duplicar la definición de un tipo y un schema de Zod de forma manual.
- **Type Assertions (`as`):**
  - NUNCA usar la palabra clave `as` (`const x = y as Type`) a menos que sea absoluta y demostrablemente necesario (ej: interactuando con librerías third-party sin tipos adecuados). En tal caso, documentar el "por qué" con un comentario.
- **Diseño de Tipos:**
  - Preferir **Discriminated Unions** en lugar de campos opcionales ambiguos cuando el estado es mutuamente excluyente (ej: `{ status: 'success', data: Data } | { status: 'error', error: string }`).
- **Branded Types para Identificadores:**
  - Usar Branded Types para evitar pasar un ID de galería donde se requiere un ID de usuario.
  - Ej: `type UserId = string & { readonly __brand: unique symbol };`

---

## 5. Patrones de Diseño en PicTik

Los siguientes patrones son el estándar para resolver problemas recurrentes en la arquitectura de PicTik:

- **Adapter Pattern:** Utilizado para integrar pasarelas de pago y servicios externos.
  - Ej: `interface PaymentAdapter` implementado por `RapydAdapter`.
- **Repository Pattern:** Separar la lógica de negocio del acceso a datos. Las consultas de Drizzle ORM deben estar encapsuladas (ej: `UserRepository.ts`).
- **Factory Pattern:** Para la creación de objetos complejos o variantes.
  - Ej: Generación de URLs prefirmadas (presigned URLs) o variantes de imágenes adaptativas.
- **Observer Pattern:** Utilizado en el procesamiento de eventos asíncronos y webhooks.
  - Ej: Un `WebhookEvent` de Rapyd notifica a diferentes listeners (email service, subscription service).
- **Strategy Pattern:** Para abstraer lógicas que varían según el contexto, como los diferentes tiers de subscripción (Free, Premium, Pro) o reglas de almacenamiento y compresión.

---

## 6. Git Workflow

### Conventional Commits
Todos los commits deben seguir el formato estandarizado:
- `feat:` Nueva funcionalidad o característica.
- `fix:` Corrección de un error o bug.
- `security:` Corrección o mejora de seguridad (ej: mitigación de vulnerabilidad).
- `refactor:` Reestructuración de código sin alterar comportamiento.
- `docs:` Actualización de documentación (ej: README, ADRs, SKILL files).
- `test:` Adición o corrección de pruebas unitarias/integración.

### Naming de Ramas (Branch Naming)
Las ramas deben usar los siguientes prefijos:
- `feature/<issue-id>-<descripcion-corta>` (ej: `feature/PT-104-rapyd-integration`)
- `fix/<issue-id>-<descripcion-corta>`
- `security/<issue-id>-<descripcion-corta>`
- `release/v<version>`

### Pull Request (PR) Checklist
El agente debe verificar esta lista antes de dar por completada una tarea que implique PR:
- [ ] ¿El código pasa todos los tests locales? (`vitest`)
- [ ] ¿Se han seguido las reglas de Lint y Formatting?
- [ ] ¿Hay comentarios explicando el "por qué" de lógicas complejas?
- [ ] ¿Se han cubierto los edge cases (casos límite) o escenarios de error de red?
- [ ] ¿No se han subido variables de entorno reales o secretos de API? (NUNCA hacer commit de `.env` o credenciales).

---

## 7. Code Review Checklist para Sub-agentes

Cuando un agente revisa el código de otro, debe evaluar las siguientes categorías:

### Tipos (Types)
- [ ] ¿Están todos los tipos bien definidos o inferidos?
- [ ] ¿Se evitó por completo el uso de `any` y aserciones `as` injustificadas?

### Seguridad (Security)
- [ ] ¿Están validados TODOS los inputs del cliente usando Zod?
- [ ] ¿Se previene la ejecución de scripts no confiables (XSS) mediante escape adecuado?
- [ ] ¿El endpoint requiere el rol/permiso correcto (Authorization)?

### Rendimiento (Performance)
- [ ] ¿Hay N+1 queries en base de datos? (Verificar queries de Drizzle).
- [ ] ¿Las funciones de React se están re-renderizando innecesariamente? (Uso adecuado de memoización si aplica).
- [ ] ¿Los assets pesados (imágenes/videos) son despachados desde Cloudflare R2 adecuadamente?

### Accesibilidad (Accessibility - a11y)
- [ ] ¿Los componentes interactivos de Radix/Shadcn UI mantienen sus propiedades ARIA?
- [ ] ¿Las imágenes de la galería tienen descripciones `alt` cuando corresponde?

### Tests
- [ ] ¿El nuevo tRPC procedure tiene su correspondiente test de contrato/comportamiento?
- [ ] ¿Se mockean correctamente las llamadas de red externas (ej: Rapyd API)?

---

## 8. Architecture Decision Records (ADR)

Toda decisión de alto impacto (cambio de ORM, nueva arquitectura de despliegue, adopción de nuevo patrón) DEBE documentarse como un ADR y almacenarse en `docs/decisions/`.

### Formato ADR (ADR Template)
```markdown
# [Short Title of Decision]

**Status:** [Proposed | Accepted | Rejected | Deprecated | Superseded]
**Date:** YYYY-MM-DD
**Author:** [Agente/Desarrollador]

## Context
[Descripción detallada del problema, situación actual y motivos por los que se necesita tomar esta decisión. ¿Cuál es la limitación o desafío?]

## Decision
[La solución específica elegida y cómo se implementará técnicamente]

## Consequences
- **Positive:** [Beneficios que se obtendrán]
- **Negative:** [Trade-offs, limitaciones, nueva deuda técnica esperada]

## Alternatives Considered
- [Alternativa 1]: Por qué se descartó.
- [Alternativa 2]: Por qué se descartó.
```

---

## 9. Criterios de Salida (Exit Criteria)

Antes de finalizar la ejecución de cualquier tarea relacionada a este Skill, asegúrate de cumplir con los siguientes puntos:

- Cero errores de TypeScript (`tsc --noEmit` pasa limpio).
- Todas las funciones y métodos exportados tienen tipos de retorno explícitos o son trivialmente inferibles sin ambigüedad.
- Todos los inputs (body, query, params) a endpoints tRPC / Express están validados estrictamente usando Zod.
- No existen comentarios `TODO` en el código sin una referencia a un ticket / issue (ej: `// TODO(PT-402): Add retry mechanism here`).
- El mensaje de commit sigue las convenciones requeridas (`feat:`, `fix:`, etc.).

---

## 10. Anti-patrones (Anti-Patterns a Evitar)

Bajo NINGUNA circunstancia debes cometer los siguientes errores:

- **NUNCA** usar `console.log` en producción. Utilizar siempre el logger estructurado oficial del proyecto.
- **NUNCA** ignorar errores con un bloque `catch` vacío o sin lógica de recuperación/reporte (`catch (e) { /* do nothing */ }`).
- **NUNCA** duplicar la lógica de validación de datos. Zod es la FUENTE ÚNICA de verdad.
- **NUNCA** hacer push directo o commits a las ramas `main` o `master`. Todo debe pasar por Pull Request y revisión.
- **NUNCA** aprobar código sin revisar explícitamente los vectores de seguridad correspondientes (XSS, SQLi, AuthZ).
- **NUNCA** tomar o implementar decisiones arquitectónicas (como añadir una nueva dependencia mayor o cambiar el framework de state management) sin documentar previamente el razonamiento vía el Framework de Cuestionamiento o un ADR.
