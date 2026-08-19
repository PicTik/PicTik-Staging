---
name: continuous-improvement
description: Framework de mejora continua, protocolo de cuestionamiento lógico, Architecture Decision Records (ADRs) y verificación de coherencia para el ciclo de vida de desarrollo de PicTik.
---

# Continuous Improvement & Logical Reasoning

Esta skill define el framework obligatorio de mejora continua, razonamiento crítico y verificación de coherencia para PicTik. Su objetivo es garantizar que cada decisión técnica, arquitectónica o de diseño sea evaluada, documentada y alineada con los estándares existentes, seguridad y compliance del proyecto.

## Framework de Cuestionamiento Lógico

Este es el **NÚCLEO** de esta skill. Antes de CADA decisión (arquitectura, diseño, implementación, despliegue), el agente DEBE completar este protocolo de razonamiento.

### Protocolo de 7 Preguntas Obligatorias

Para cada decisión técnica importante, el agente debe documentar y responder explícitamente:

1. **¿Por qué esta solución y no otra?** — Enumera al menos 2 alternativas consideradas, analizando pros y contras.
2. **¿Qué trade-offs implica?** — Evalúa el impacto en: performance, complejidad, seguridad, mantenibilidad y costo.
3. **¿Cumple con los estándares de seguridad?** — Referencia cruzada con la skill `cybersecurity-gold-standards`. ¿Introduce nuevos vectores de ataque?
4. **¿Es escalable para el crecimiento esperado de PicTik?** — Considera escenarios de carga 10x y 100x de la carga actual.
5. **¿Hay impacto en compliance de datos personales?** — Referencia cruzada con la skill `data-privacy-compliance`. ¿Toca PII o flujos de consentimiento?
6. **¿Es coherente con los patrones existentes en el codebase?** — Verifica compatibilidad con el Adapter Pattern, convenciones tRPC, patrones Drizzle.
7. **¿Se puede testear de forma aislada?** — ¿El diseño favorece dependencias mockeables y pruebas unitarias rápidas?

### Formato de Decisión Documentada

Cuando se requiera documentar una decisión (ver Niveles de Decisión), utiliza esta plantilla:

```markdown
## Decisión: [Título de la decisión]

### Contexto
[Qué problema exacto se está resolviendo]

### Alternativas Evaluadas
| Alternativa | Pros | Contras | Seguridad | Compliance |
|-------------|------|---------|-----------|------------|
| A           |      |         |           |            |
| B           |      |         |           |            |

### Decisión Tomada
[Qué se decidió finalmente y por qué]

### Consecuencias
[Qué implica esta decisión a futuro en términos de deuda técnica, operaciones o escalabilidad]

### Verificación
- [ ] Coherente con patrones existentes
- [ ] Testeable
- [ ] Segura (cumple OWASP)
- [ ] Compliant (cumple GDPR/LATAM)
```

### Niveles de Decisión

No todas las decisiones requieren el protocolo completo. Clasifica la decisión y actúa en consecuencia:

- **Nivel 1 (Trivial)**: Formato, naming, refactoring menor. → Sigue las convenciones existentes, no se requiere documentación especial.
- **Nivel 2 (Táctico)**: Nuevo componente UI, nuevo endpoint de API de bajo riesgo. → Justificación breve en el mensaje de commit o en el Decision Log.
- **Nivel 3 (Estratégico)**: Nueva dependencia npm, cambio de arquitectura local, nueva integración de terceros. → Requiere protocolo completo y **Architecture Decision Record (ADR)**.
- **Nivel 4 (Crítico)**: Cambio en el modelo de seguridad, alteración del flujo de pagos, cambio en el modelo de datos core. → Requiere protocolo completo, **ADR completo** y **Revisión obligatoria del equipo/usuario (Checkpoint)**.

## Architecture Decision Records (ADR)

Para decisiones Nivel 3 y Nivel 4, se DEBE redactar un Architecture Decision Record.

### Formato ADR Obligatorio

```markdown
# ADR-NNN: [Título descriptivo]

## Estado
[Propuesto | Aceptado | Rechazado | Deprecado | Sustituido por ADR-XXX]

## Contexto
[Situación que motiva la decisión. Incluir constraints técnicos, fuerzas del mercado, y contexto actual del sistema.]

## Decisión
[La decisión tomada en términos claros, directos e imperativos. "Usaremos X para lograr Y".]

## Alternativas Consideradas
### Alternativa A: [Nombre]
- Pros: [Lista]
- Contras: [Lista]
### Alternativa B: [Nombre]
- Pros: [Lista]
- Contras: [Lista]

## Consecuencias
### Positivas
- [Mejoras esperadas]
### Negativas
- [Deuda técnica adquirida, complejidad añadida]
### Riesgos
- [Riesgos operacionales o de seguridad a mitigar]

## Verificación de Seguridad
[¿Cumple lineamientos OWASP? ¿Cómo afecta la superficie de ataque del sistema?]

## Verificación de Compliance
[¿Cuál es el impacto en GDPR y normativas de privacidad LATAM?]

## Referencias
[Links a documentación interna, issues, o skills relacionadas (ej: data-privacy-compliance)]
```

Los ADRs se almacenan en: `docs/decisions/ADR-NNN-titulo.md`.
La numeración debe ser secuencial y rellenada con ceros: `ADR-001`, `ADR-002`, etc.

### ADRs Existentes a Documentar (Backlog)

Para establecer la línea base de PicTik, el agente debe documentar gradualmente estas decisiones fundacionales:

- **ADR-001**: TypeScript de extremo a extremo con tRPC.
- **ADR-002**: MySQL/TiDB con Drizzle ORM como base transaccional.
- **ADR-003**: Adapter Pattern para pasarelas de pago.
- **ADR-004**: Hosted Checkout de Rapyd (evitar custom forms por PCI-DSS).
- **ADR-005**: IP hashing en lugar de IP en claro para audit logs.
- **ADR-006**: Carga condicional de scripts de analítica post-consentimiento.
- **ADR-007**: Hetzner CX22 como servidor de producción.
- **ADR-008**: Cloudflare R2 como almacenamiento de objetos.

## Verificación de Coherencia del Código

Antes de introducir nuevos patrones o soluciones arquitectónicas, el agente DEBE:

1. **Buscar en el codebase** patrones existentes que resuelvan problemas similares.
2. Si existe un patrón, **ÚSALO**. No introduzcas una segunda forma de hacer lo mismo.
3. Si un nuevo patrón es genuinamente superior, **documenta por qué** (Nivel 3 - ADR) y planifica la migración del patrón antiguo.
4. Verifica que las convenciones de *naming* coincidan con el código adyacente.
5. Verifica que la organización de archivos coincida con la estructura del proyecto.
6. Comprueba que el manejo de errores siga los estándares globales.
7. Verifica que los patrones de testing emulen los archivos de test existentes.

### Checklist de Coherencia

- [ ] Utiliza el mismo estilo de imports que el resto del codebase.
- [ ] Sigue la estructura de componentes establecida (Radix/Shadcn UI + Tailwind 4).
- [ ] Usa **Drizzle ORM** para TODO acceso a DB (Cero SQL crudo, salvo migraciones específicas documentadas).
- [ ] Usa **Zod** para TODA validación de entrada (Sin validaciones manuales `if (!req.body.name)`).
- [ ] Usa **tRPC** para toda comunicación cliente-servidor (Excepción: webhooks externos).
- [ ] El manejo de errores coincide con los patrones establecidos (errores tipados, códigos HTTP correctos).
- [ ] La estructura de tests coincide con los archivos Vitest existentes (arrange, act, assert).

## Retrospectivas Automatizadas

Al finalizar cada feature épica, sprint o cambio arquitectónico significativo, el agente debe generar una retrospectiva estructurada:

```markdown
## Retrospectiva: [Nombre de la Feature o Cambio]

### Qué salió bien
- [Éxitos técnicos, integraciones fluidas]

### Qué se puede mejorar
- [Cuellos de botella, problemas de diseño imprevistos]

### Lecciones aprendidas
- [Conocimiento adquirido sobre librerías, APIs de terceros, etc.]

### Acciones para el próximo ciclo
- [ ] [Acción concreta y asignable]
- [ ] [Actualización de documentación]

### Métricas de la Feature
- Tiempo estimado de desarrollo: [X] horas
- Issues/Bugs encontrados en review: [N]
- Tests añadidos: [N] (Unitarios/Integración)
- Deuda técnica introducida: [baja/media/alta] (Breve justificación)
```

## Decision Log (Lightweight)

Para decisiones de Nivel 2 que no requieren la sobrecarga de un ADR completo, mantén un registro en `docs/decisions/decision-log.md`:

```markdown
# Decision Log

| Fecha | Decisión | Razón Principal | Autor | Revisado Por |
|-------|----------|-----------------|-------|--------------|
| YYYY-MM-DD | [Decisión técnica] | [Justificación breve] | [Agente] | [Usuario/Tech Lead] |
```

## Protocolo de Checkpoint

Para mantener la seguridad y la arquitectura intactas, el agente LLM DEBE **DETENERSE** y presentar la decisión al usuario (USER) antes de ejecutar cualquiera de las siguientes acciones:

- Agregar una nueva dependencia `npm`.
- Crear o modificar una tabla/columna en la base de datos.
- Alterar lógica de autenticación o autorización.
- Modificar el flujo de pagos (especialmente Rapyd).
- Modificar los headers de seguridad o la Content Security Policy (CSP).
- Eliminar código fuente o realizar purgado de datos.
- Modificar el esquema de variables de entorno (agregar/eliminar secretos).
- Modificar cualquier lógica en los adapters (e.g., RapydAdapter).
- Cualquier cambio que toque el manejo o almacenamiento de datos personales (PII).

**Formato del Checkpoint:** Presenta claramente: Qué planeas hacer, por qué es necesario, alternativas descartadas y el impacto en seguridad/compliance. Espera confirmación explícita (Proceed).

## Métricas de Calidad del Proyecto

El proceso de mejora continua requiere observar y mejorar activamente las siguientes métricas:

- **Code coverage**: Objetivo superior al 80%.
- **TypeScript strictness**: Cero usos de `any`, cero usos de `as` sin un comentario de justificación exhaustivo.
- **Dependency health**: Cero vulnerabilidades conocidas (según `npm audit`), todas las dependencias actualizadas en el último año.
- **Technical debt**: Conteo rastreado de etiquetas `TODO`, `FIXME` o `HACK`.
- **Security posture**: Puntaje de la última auditoría, conteo de hallazgos abiertos.
- **Test health**: Tasa de éxito, ausencia de tests inestables (flaky tests).
- **Build health**: Tendencia del tiempo de build, tendencia del tamaño de los artefactos (`dist/`).

## Mejora de Skills (Meta-improvement)

Las propias skills del agente son entes vivos que deben evolucionar:

1. **Tras cada hallazgo de auditoría:** Actualizar la skill relevante (ej. `security-audit`, `recursive-code-review`) para prevenir la recurrencia del fallo.
2. **Tras cada incidente:** Añadir las lecciones aprendidas a la skill de mitigación de incidentes.
3. **Revisión trimestral:** ¿Siguen siendo precisas y exhaustivas las skills actuales frente al stack tecnológico (ej. React 19, Vite)?
4. **Control de versiones:** Versionar los archivos `.md` de las skills junto con el codebase general.
5. **Efectividad:** Rastrear cualitativamente si los problemas cubiertos por las skills efectivamente disminuyen con el tiempo.

### Feedback Loop: Auditoría → Reglas de Revisión

El ciclo de mejora técnica debe estar integrado sistemáticamente:

1. Auditoría de seguridad encuentra vulnerabilidad/problema **X** (skill `security-audit`).
2. Se añade una regla de detección estática para **X** en la skill `recursive-code-review`.
3. Se actualiza la skill `cybersecurity-gold-standards` con el patrón de mitigación estándar para **X**.
4. Se verifica que **X** no ocurra en el siguiente ciclo de desarrollo.
5. Se documenta la mitigación general mediante un ADR si cambia significativamente la arquitectura defensiva.

## Criterios de Salida

El uso de esta skill se considera exitoso si:
- El protocolo de decisión (7 preguntas) se completó para TODAS las decisiones Estratégicas (Nivel 3+).
- Los ADRs fundacionales (001 a 008) están redactados y documentan la línea base del proyecto.
- La verificación de coherencia pasa limpiamente en todo el código nuevo (sin duplicación de responsabilidades).
- Se ha generado una retrospectiva por cada feature terminada.
- Las métricas de calidad técnica están trackeadas y muestran una tendencia positiva o estable.
- Las skills del agente se han actualizado en respuesta a auditorías, bugs o feedback del usuario.

## Anti-patrones

- **NUNCA** tomar decisiones arquitectónicas o introducir dependencias sin documentar el razonamiento exhaustivamente.
- **NUNCA** introducir un segundo patrón para resolver un problema que ya tiene un patrón establecido en el codebase.
- **NUNCA** ignorar o evadir el protocolo de cuestionamiento de 7 preguntas justificándose en "falta de tiempo" o "simplicidad".
- **NUNCA** crear ADRs retroactivos falsos (se debe documentar el estado *real* y los compromisos tomados, no una visión idealizada del pasado).
- **NUNCA** asumir que una decisión previa o código existente es incorrecto sin evidencia sólida, tests fallidos o degradación de métricas.
- **NUNCA** modificar el contenido de una skill en la carpeta `.agents` sin documentar qué incidente o aprendizaje motivó el cambio.
- **NUNCA** ignorar las métricas de calidad cuando experimentan bajadas marcadas (ej. coverage cayendo, warnings de typescript aumentando).
- **NUNCA** ejecutar acciones que están listadas en el **Protocolo de Checkpoint** sin detenerse primero y presentar el caso de negocio/tecnológico al usuario.
- **NUNCA** aprobar código en PRs o reviews que sea incoherente con los patrones existentes, a menos que exista un ADR formal que declare una migración de patrón.
