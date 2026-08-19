---
name: data-privacy-compliance
description: Skill for enforcing GDPR and LATAM data protection laws (Colombia, Mexico, Ecuador, Argentina, Chile) for PicTik.
---

# Data Privacy Compliance (GDPR & LATAM)

Esta skill define las reglas, procesos y responsabilidades que los agentes deben aplicar en PicTik para garantizar el cumplimiento normativo en materia de privacidad de datos, cubriendo el Reglamento General de Protección de Datos (GDPR) de la Unión Europea y las principales leyes de protección de datos de Latinoamérica (Colombia, México, Ecuador, Argentina, Chile).

Los agentes deben referirse a este documento al diseñar flujos de usuario, implementar bases de datos, integrar analíticas, o establecer políticas de retención.

## Principios Transversales de Protección de Datos

Para operar a nivel global de forma segura, PicTik adopta un enfoque basado en los siguientes principios fundamentales, comunes a las normativas de privacidad más exigentes:

- **Privacy by Design & Privacy by Default**: La privacidad no es una funcionalidad añadida al final; se integra en la arquitectura desde el inicio. Por defecto, las configuraciones deben ofrecer la máxima privacidad al usuario (ej. sin cookies no esenciales sin consentimiento).
- **Data Minimization (Minimización de Datos)**: Solo recolectar, procesar y almacenar los datos personales que sean estrictamente necesarios para cumplir con el propósito específico de la funcionalidad en cuestión.
- **Purpose Limitation (Limitación de la Finalidad)**: Los datos personales recogidos solo deben utilizarse para los fines explícitamente declarados al usuario en el momento de la recolección.
- **Storage Limitation (Limitación del Plazo de Conservación)**: Los datos personales no deben conservarse más tiempo del necesario para los fines para los que fueron recabados. Requiere periodos de retención definidos y eliminación automática (data retention).
- **Accuracy (Exactitud)**: Los datos personales deben ser exactos y estar actualizados. Es necesario proporcionar mecanismos para que los titulares puedan corregir o actualizar sus datos (self-service).
- **Integrity & Confidentiality (Integridad y Confidencialidad)**: Procesamiento seguro mediante medidas técnicas y organizativas adecuadas, incluyendo encriptación in transit / at rest y controles de acceso estrictos (RBAC).

## GDPR (Reglamento General de Protección de Datos — UE)

El GDPR establece el estándar global más estricto. Aplica a PicTik si procesa datos de residentes de la UE, incluso si la infraestructura está fuera de la UE.

- **Bases legales del tratamiento**: Todo tratamiento debe tener una base legal. Las más comunes en PicTik son:
  - *Consentimiento*: Para analíticas, marketing, o procesamiento de datos sensibles (fotos con rostros).
  - *Contrato*: Para prestar el servicio acordado (ej. cobro, entrega de la galería).
  - *Interés Legítimo*: Prevención de fraude, seguridad de la red.
- **Derechos del titular (Data Subject Rights)**: Acceso (conocer qué datos se tienen), Rectificación (corregir), Supresión (Right to Erasure o "derecho al olvido"), Portabilidad (obtener datos en JSON/CSV), Oposición (detener el tratamiento), Limitación.
- **DPIA (Data Protection Impact Assessment)**: Obligatorio si el tratamiento entraña un alto riesgo para los derechos y libertades (ej. procesamiento a gran escala de datos biométricos o uso sistemático de nuevas tecnologías). En PicTik, debe evaluarse debido a las fotografías.
- **DPO (Data Protection Officer)**: Designar un DPO si las actividades principales consisten en el seguimiento regular y sistemático a gran escala o tratamiento de categorías especiales de datos a gran escala.
- **Breach Notification**: Las brechas de seguridad deben notificarse a la autoridad supervisora en 72 horas, y a los titulares sin demora si existe alto riesgo para sus derechos.
- **Transferencias Internacionales**: Si los datos salen del Espacio Económico Europeo (EEE), deben estar amparados por Decisiones de Adecuación, Cláusulas Contractuales Tipo (SCCs) o Normas Corporativas Vinculantes.
- **Aplicación a PicTik**: Las fotos son datos personales. Si se pueden extraer datos biométricos (reconocimiento facial) para identificar a alguien unívocamente, se consideran categorías especiales de datos que requieren consentimiento explícito (Art. 9).

## Colombia — Ley 1581 de 2012 + Decreto 1377 de 2013

Colombia posee un marco regulatorio robusto y estricto, aplicable al tratamiento de datos en el país o cuando las leyes colombianas aplican por tratados internacionales o contratos.

- **Tipos de datos**: Clasifica los datos en público, semiprivado, privado y sensible.
- **Autorización previa, expresa e informada**: Es fundamental. Está estrictamente prohibido el consentimiento tácito o el pre-marcado de casillas (NO opt-out). Debe ser explícito (opt-in).
- **Registro Nacional de Bases de Datos (RNBD)**: Obligación de registrar las bases de datos que contengan datos personales ante la Superintendencia de Industria y Comercio (SIC), sujeto a umbrales de activos.
- **Derechos ARCO**: Acceso, Rectificación, Cancelación y Oposición.
- **Habeas Data**: Derecho fundamental (Art. 15 de la Constitución) que permite conocer, actualizar y rectificar la información recogida en bases de datos.
- **Oficial de Protección de Datos**: Obligatorio para los responsables o encargados de cierto tamaño o que traten datos sensibles masivamente.
- **Transferencia internacional**: Prohibida a países que no proporcionen niveles adecuados de protección (determinados por la SIC), salvo excepciones (como autorización expresa del titular o contratos específicos).
- **Multas**: Sanciones pecuniarias de hasta 2,000 SMLMV (Salarios Mínimos Legales Mensuales Vigentes) y cierres temporales/definitivos.
- **PicTik**: Las fotografías de personas se consideran datos sensibles según la SIC (porque revelan características biométricas). Por ende, se requiere autorización explícita y separada, y el titular debe saber que no está obligado a autorizar el tratamiento de datos sensibles. La cadena de custodia de la autorización del modelo/cliente recae primero en el fotógrafo, pero la plataforma (como encargado/responsable solidario) debe exigir confirmación de este permiso.

## México — LFPDPPP + Ley General de Protección de Datos (sector público)

La Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP) regula al sector privado.

- **Aviso de Privacidad**: Es el pilar del cumplimiento. Debe existir en tres modalidades: Integral, Simplificado y Corto. Debe estar accesible antes de la recolección de los datos.
- **Consentimiento**: Puede ser tácito para datos personales no sensibles (si el Aviso de Privacidad está disponible y no hay oposición), pero DEBE ser expreso (y por escrito) para datos sensibles o patrimoniales/financieros.
- **Derechos ARCO + Portabilidad**: Ejercicio gratuito, con plazos definidos (20 días para responder, 15 días para hacer efectivo).
- **Autoridad Reguladora**: Instituto Nacional de Transparencia, Acceso a la Información y Protección de Datos Personales (INAI).
- **Transferencia vs. Remisión**: La ley distingue entre "transferencia" (a terceros, requiere consentimiento en muchos casos) y "remisión" (entre responsable y encargado, requiere contrato de servicios pero no nuevo consentimiento).
- **Multas**: Sanciones económicas considerables (de 100 a 320,000 UMA - Unidad de Medida y Actualización).
- **PicTik en México**: El Aviso de Privacidad debe estar claramente visible (link en el footer, checkbox en el registro) *antes* de que el usuario envíe cualquier información. 

## Ecuador — LOPDP (Ley Orgánica de Protección de Datos Personales, 2021)

La LOPDP de Ecuador se inspira fuertemente en el GDPR europeo, modernizando el marco de privacidad del país.

- **Consentimiento**: Debe ser libre, específico, informado e inequívoco. Explícito para datos sensibles.
- **DPO (Delegado de Protección de Datos)**: Es obligatorio si el tratamiento lo realiza el sector público, o si se realiza a gran escala o monitoreo sistemático.
- **Evaluación de Impacto**: Similar al DPIA del GDPR, requerido previo al tratamiento cuando existan riesgos altos (ej. uso de IA, biometría, datos sensibles a gran escala).
- **Derechos**: Además de los clásicos (acceso, rectificación, eliminación o cancelación, oposición), añade explícitamente la portabilidad y el derecho a no ser objeto de decisiones individuales automatizadas.
- **Autoridad**: Superintendencia de Protección de Datos Personales.
- **Transferencias internacionales**: Permitidas a jurisdicciones con niveles de protección adecuados o mediante el establecimiento de garantías apropiadas (cláusulas estándar, BCRs).
- **Multas**: Sanciones que pueden ir desde el 1% hasta el 10% del volumen de negocio (o facturación) correspondiente al ejercicio económico anterior.

## Argentina — Ley 25.326 + Proyecto de Reforma

Argentina tiene una de las leyes más antiguas de la región, pero es reconocida por la UE como un país con nivel adecuado de protección (Adequacy Decision). Hay un proyecto de ley para actualizarla a estándares tipo GDPR.

- **Adecuación**: Su estatus de país adecuado facilita el flujo de datos desde Europa.
- **Autoridad**: Agencia de Acceso a la Información Pública (AAIP).
- **Registro**: Obligación de registrar las bases de datos (públicas y privadas destinadas a dar informes) ante la AAIP.
- **Consentimiento**: Debe ser libre, expreso e informado.
- **Derechos**: Acceso (gratuito cada 6 meses), rectificación, actualización, supresión y confidencialidad.
- **Habeas Data**: Consagrado en el Art. 43 de la Constitución Nacional.
- **Datos sensibles**: Solo pueden tratarse si existe consentimiento expreso y por escrito, o una ley que lo autorice específicamente.
- **Transferencia internacional**: Prohibida a países sin niveles de protección adecuados, salvo que exista consentimiento expreso o contratos modelo aprobados por la AAIP.

## Chile — Ley 19.628 + Reforma 2024 (Ley 21.719)

Chile actualizó recientemente su normativa (Reforma promulgada en agosto de 2024, con un periodo de vacancia de 24 meses), acercándose significativamente al estándar del GDPR.

- **Agencia de Protección de Datos Personales**: Crea una nueva autoridad dedicada de forma exclusiva, autónoma y con potestad sancionatoria.
- **Bases de licitud**: Se amplían para no depender exclusivamente del consentimiento (ej. ejecución de contrato, obligación legal, interés legítimo).
- **Derechos**: Expande los derechos ARCO, agregando la portabilidad y la oposición a decisiones individuales automatizadas o perfilamiento.
- **Evaluación de Impacto**: Obligatoria para tratamientos que supongan un alto riesgo, como operaciones a gran escala, monitoreo a gran escala o tratamientos con nuevas tecnologías.
- **DPO**: Establece la figura del Oficial de Protección de Datos, siendo obligatorio en ciertos supuestos y atenuante en caso de infracciones si está designado y operando correctamente.
- **Multas**: Aumentan drásticamente, clasificándose en leves, graves y gravísimas, pudiendo llegar hasta 20,000 UTM (Unidades Tributarias Mensuales), equivalente a aprox. USD 1.5 millones, o multas basadas en ingresos para empresas de gran tamaño.
- **Transferencias Internacionales**: Se regula el flujo transfronterizo, permitiéndolo hacia países adecuados o bajo garantías como cláusulas contractuales tipo o reglas corporativas vinculantes.

## Tabla Comparativa de Normativas

| Aspecto | GDPR (UE) | Colombia | México | Ecuador | Argentina | Chile (Ref. 2024) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Base legal ppal.** | Múltiples (consent., contrato, int. leg.) | Consentimiento (Autorización previa) | Consentimiento | Múltiples (similar GDPR) | Consentimiento | Múltiples (similar GDPR) |
| **Consentimiento** | Explícito / Opt-in | Previo, expreso, informado (Opt-in) | Tácito / Expreso para sensibles | Inequívoco / Explícito p/ sensibles | Libre, expreso e informado | Previo, inequívoco / Expreso p/ sensibles |
| **Derechos (Data Subject)** | Acceso, Rectificación, Supresión, Oposición, Portabilidad, Limitación | ARCO (Acceso, Rectificación, Cancelación, Oposición) | ARCO + Portabilidad | ARCO + Portabilidad + No decisión automat. | Acceso, Rectificación, Supresión | ARCO + Portabilidad + Oposición perfilamiento |
| **Autoridad Supervisora** | DPA por país / EDPB | SIC (Superintendencia de Ind. y Comercio) | INAI | Superintendencia de Protección de Datos | AAIP | Agencia de Protección de Datos Personales |
| **DPO Obligatorio** | Tratamientos gran escala o sensibles | Ciertos responsables (Gran volumen) | No especificado formalmente (pero recomendado) | Sector público, gran escala, control sist. | No obligatorio formalmente | Ciertos casos (volumen, riesgo). Atenuante de multas |
| **Multas Máximas** | Hasta 20M EUR o 4% de facturación global | Hasta 2,000 SMLMV (aprox. USD 600K) | Hasta 320,000 UMA (aprox. USD 2M) | 1% a 10% del volumen de negocio | Montos en Pesos ARS (actualizables por AAIP) | Hasta 20,000 UTM (aprox. USD 1.5M) |
| **Transferencia Internacional** | Adecuación, SCCs, BCRs | Prohibida sin nivel adecuado (o autorización/contrato) | Se diferencia transferencia de remisión. Consentimiento si es transferencia. | Adecuación, garantías apropiadas (SCCs) | Adecuación (UE reconoce a ARG). Modelo AAIP | Adecuación, garantías, reglas corporativas |
| **Notificación de Brechas** | 72h a DPA, sin demora al titular | Inmediato a SIC | Inmediato a titulares (si hay riesgo significativo) | A Autoridad (5 días) y titular (según riesgo) | A la AAIP y a los titulares | A la Agencia y a los titulares |
| **Datos Sensibles** | Consentimiento explícito requerido (Art. 9) | Autorización expresa, no obligatoria. | Consentimiento expreso y por escrito. | Consentimiento explícito requerido. | Consentimiento expreso por escrito. | Consentimiento expreso (salvo excepciones legales) |

## Implementación Técnica en PicTik

La teoría legal debe traducirse en implementaciones técnicas concretas dentro del stack de PicTik (React 19, Node.js, Express, Drizzle, etc.):

- **Consent Banner (CookieBanner.tsx)**: 
  - Requiere configuración granular por categoría: Estrictamente Necesarias (siempre activas, no requieren consentimiento), Analíticas, Marketing/Publicidad.
  - El banner no puede asumir consentimiento (sin opt-in pre-marcado).
- **Consent Records en DB (`consentRecords` table)**: 
  - La base de datos debe mantener un log de los consentimientos otorgados.
  - Campos mínimos: `userId` (si existe) o `sessionId` temporal, `timestamp` de aceptación, `categories` aceptadas (JSON array), `policyVersion` aplicable en ese momento, y la `ipHash` del usuario en el momento de consentir.
- **Data Mapping**:
  - Toda la plataforma debe tener claro qué datos se recolectan (email, nombre, tarjeta, fotos), dónde se almacenan (TiDB, Cloudflare R2), quién tiene acceso (fotógrafo, cliente, admins), y retención aplicable.
- **Anonimización y Pseudonimización**:
  - **IP Hashing**: Implementado en el `auditLog`. Nunca almacenar IPs en texto plano (plain text).
  - Data Masking: Ocultar información sensible en la UI y logs (ej. de los números de tarjeta, Rapyd solo devuelve últimos 4 dígitos).
- **Right to Erasure (Derecho a la supresión)**:
  - Procedimiento técnico implementado (tRPC mutation) para eliminar al usuario, que cascadea en la eliminación física de: cuenta de usuario + galerías asociadas + fotos en R2 (deleteObject) + registros que lo identifiquen. 
  - *Atención*: Algunos datos deben conservarse por obligación legal (facturación).
- **Data Portability (Portabilidad)**:
  - Un endpoint `exportUserData` que agrupe toda la información del usuario desde la DB y genere un JSON descargable estandarizado.
- **Cookie Management**:
  - Clasificación estricta. El backend y el frontend deben respetar el estado de `consentRecords` para emitir cookies o tokens de tracking.
- **Analytics**:
  - **Carga condicional**: Scripts de terceros (PostHog, Google Analytics) solo pueden insertarse/activarse post-consentimiento (como se modela en `AnalyticsConsentScript.tsx`).

## Políticas y Documentos Requeridos

PicTik requiere disponer de los siguientes documentos legales y accesibles al usuario:

- **Política de Privacidad (Multipaís)**: Debe usar un template structure que abarque de forma genérica las obligaciones del GDPR y disponga de anexos o secciones específicas por jurisdicción (ej. "Tus derechos en Colombia", "Para residentes en México...").
- **Términos y Condiciones de Servicio (ToS)**: Reglas de uso de la plataforma.
- **Política de Cookies**: Detalle de cada cookie usada, su proveedor, duración y propósito.
- **Aviso de Privacidad (México)**: Especialmente redactado para cumplir la LFPDPPP, con versiones cortas en formularios.
- **Procedimiento de atención de derechos ARCO**: Proceso interno documentado de cómo un usuario solicita sus datos (soporte@pictik.com o form automatizado) y plazos de respuesta.
- **Plan de respuesta a incidentes de datos (Breach Response Plan)**: Manual interno de qué hacer, a quién notificar y en qué plazos ante un hackeo o fuga de datos.

## Data Retention y Eliminación

La retención de datos no debe ser infinita. Debe automatizarse un job de limpieza (cron o trigger) basado en los siguientes periodos de retención:

- **User accounts (Cuentas de usuario)**: Activas mientras el usuario haga login. Tras solicitud de eliminación (Right to Erasure), mantener en `soft delete` (para reversión) un máximo de 30 días, luego `hard delete`.
- **Photos (Fotografías en R2)**: Mientras la galería asociada esté activa + un periodo de gracia configurable post-vencimiento de la galería (ej. 15-30 días). Luego deben ser destruidas del bucket R2.
- **Payment records (Registros de pago/suscripciones)**: Conservar el mínimo legal por jurisdicción fiscal (usualmente entre 5 y 10 años). No se borran con el "Right to Erasure" si la ley fiscal exige retenerlos.
- **Audit logs (Logs de auditoría)**: 2 años. Contienen IPs hasheadas y acciones de los usuarios.
- **Consent records (Registros de consentimiento)**: Durante todo el tiempo de vida de la relación (mientras el usuario exista o la cookie esté vigente) + 5 años como evidencia legal ante posibles investigaciones de la DPA (autoridad).
- **Analytics data**: 26 meses (estándar comúnmente aceptado por GDPR en Google Analytics).

## Fotografías como Datos Personales

La naturaleza de PicTik (entregable de fotos) plantea desafíos de privacidad críticos.

- **Photos containing identifiable people = personal data**: Cualquier foto de la cual se pueda identificar directa o indirectamente a una persona física es un dato personal bajo GDPR y LATAM.
- **Datos Biométricos (GDPR Art. 9 / LATAM datos sensibles)**: Si se implementan herramientas de IA (reconocimiento facial) sobre las fotos para buscar a personas, se extraen datos biométricos. Estos requieren consentimiento explícito. Aunque sea solo para la galería visual, la foto en sí es dato sensible en Colombia, y puede serlo en otras jurisdicciones.
- **Model Release / Consent Chain (Cadena de consentimiento)**: PicTik opera bajo un modelo donde el *fotógrafo* captura la imagen. La plataforma asume contractualmente (vía ToS) que el fotógrafo ha obtenido el permiso legal (model release o consentimiento) de las personas retratadas antes de subir las fotos. La plataforma procesa esos datos, y el cliente (viewer) los recibe.
- **Watermarking as proportionate measure**: Aplicar marcas de agua (watermarking) protege el modelo de negocio del fotógrafo y, indirectamente, ayuda a prevenir el uso no autorizado de rostros o descargas masivas (scraping), fungiendo como medida de protección organizativa.
- **Right to erasure implications**: Si un modelo (sujeto en la foto) ejerce su derecho al olvido directamente contra PicTik, el procedimiento debe ser claro: la plataforma bloquea/elimina la foto e informa al fotógrafo responsable.

## Criterios de Salida

Al implementar cualquier componente que afecte la privacidad de los usuarios, se deben verificar afirmativamente los siguientes criterios:

- [ ] Consent banner es 100% funcional, bloquea scripts invasivos por defecto y ofrece opciones granulares (categorías).
- [ ] La Política de Privacidad está publicada, versionada y enlazada de forma visible.
- [ ] Los Endpoints para Data Subject Rights (ARCO, supresión/Right to Erasure, exportación) están implementados y probados.
- [ ] La retención de datos y caducidad de fotos está automatizada (cron/workers).
- [ ] La tabla `consentRecords` se actualiza correctamente y registra el `timestamp` y las categorías aceptadas.
- [ ] El script de Analytics carga **ÚNICAMENTE** tras el opt-in del usuario.
- [ ] No existen datos de identificación personal (PII) en los logs de la aplicación de texto plano (stdout/stderr o archivos log crudos).
- [ ] Existe documentación interna de un procedimiento de notificación de brechas.

## Anti-patrones

Lo que **NUNCA** debes hacer o sugerir en la implementación de PicTik:

- **NUNCA** recolectar o procesar datos sin identificar y documentar previamente su base legal correspondiente.
- **NUNCA** usar modelos de consentimiento pre-marcado (casillas con "check" por defecto) o de opt-out. Jurisdicciones como Colombia, Ecuador y el GDPR requieren un acto afirmativo de opt-in.
- **NUNCA** almacenar direcciones IP, contraseñas o identificadores gubernamentales en texto claro en logs del servidor, DB o bases de datos de analíticas. Se deben hashear las IPs (salt+hash).
- **NUNCA** cargar scripts de terceros (tracking, analíticas, ads, pixels) antes de que el usuario haya hecho click en "Aceptar" en el banner de consentimiento.
- **NUNCA** asumir que cumplir con la ley de un país (ej. México) exime de cumplir las demás (ej. GDPR o Colombia). Se debe verificar CADA jurisdicción en la que operan activamente fotógrafos y clientes de PicTik.
- **NUNCA** eliminar los registros de `consentRecords` (logs de consentimiento) cuando un usuario elimina su cuenta, ya que estos logs constituyen la evidencia legal (compliance audit trail) requerida para demostrar que el usuario consintió en su momento.
- **NUNCA** transferir o replicar bases de datos (backups, workers) a servidores o países que no cuenten con niveles de adecuación o mecanismos de garantía documentados y formales.
- **NUNCA** tratar, subir o procesar fotografías que contienen personas sin considerar las implicaciones de datos biométricos y la obtención de las correspondientes autorizaciones por parte del fotógrafo en la cadena de responsabilidad.
