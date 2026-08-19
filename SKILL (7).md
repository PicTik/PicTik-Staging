---
name: rapyd-payment-integration
description: Guía exhaustiva de integración de la pasarela de pago Rapyd Collect API, pruebas en sandbox, y migración a producción para el SaaS PicTik.
---

# Integración de Pagos con Rapyd en PicTik

Esta skill define las reglas, arquitectura, y procedimientos obligatorios para implementar y mantener la integración de pagos con la plataforma **Rapyd (Collect API)** en el entorno de PicTik.

## Arquitectura de Integración Rapyd en PicTik

La arquitectura de pagos en PicTik sigue un diseño de adaptador estricto para aislar la lógica del proveedor de pagos del resto del sistema.

*   **Patrón Adapter**: La clase `RapydAdapter` debe implementar la interfaz `PaymentAdapter`. Esto asegura que el sistema central de pagos de PicTik pueda operar agnósticamente del proveedor.
*   **Consumo Exclusivo en Backend (Backend-only)**: Las claves de API y la firma de solicitudes ocurren exclusivamente en el servidor. Las claves *NUNCA* abandonan el entorno del servidor.
*   **Flujo Principal**:
    1.  El Client (React) hace una solicitud vía tRPC.
    2.  El servidor tRPC invoca al `RapydAdapter`.
    3.  El `RapydAdapter` se comunica con la Rapyd API.
    4.  El proveedor de pagos notifica al sistema vía Webhook.
    5.  El manejador del webhook actualiza la DB.
*   **Archivos Involucrados**:
    *   `server/payments/rapyd.ts`: Implementación del adaptador y lógica de firma.
    *   `server/webhooks/rapyd.ts`: Controlador de Express para procesar notificaciones.
    *   `server/_core/env.ts`: Validación Zod de las variables de entorno relacionadas con Rapyd.

## Configuración de Variables de Entorno

La seguridad e inicialización correcta del adaptador dependen de las siguientes variables de entorno:

*   `RAPYD_ACCESS_KEY`: Clave de acceso de la API.
*   `RAPYD_SECRET_KEY`: Clave secreta de la API.
*   `RAPYD_BASE_URL`: URL base del entorno. Debe ser `https://sandboxapi.rapyd.net` (para desarrollo/sandbox) o `https://api.rapyd.net` (para producción).
*   **Regla Crítica**: *NUNCA* se debe usar el prefijo `VITE_` para estas variables. Hacerlo expondría las claves secretas en el bundle público del cliente.
*   **Entornos**: Se requieren claves diferentes para cada entorno (dev, staging, producción).
*   **Rotación**: Procedimiento obligatorio de rotación anual o en caso de sospecha de compromiso, actualizando primero en staging y luego en producción sin tiempo de inactividad (utilizando las claves secundarias que provee Rapyd si están disponibles).

## Firma de Solicitudes (Request Signing)

Todas las llamadas a la Rapyd API requieren una firma generada criptográficamente (HMAC-SHA256).

*   **Generación de Firma**: La firma es un hash codificado en Base64.
*   **Componentes del Hash**: `http_method + url_path + salt + timestamp + access_key + secret_key + body_string`
*   **Salt**: Una cadena aleatoria única generada para cada solicitud (ej. UUID v4 o random bytes).
*   **Timestamp**: Tiempo Unix en segundos (`Math.floor(Date.now() / 1000)`).
*   **Headers Requeridos**:
    *   `access_key`
    *   `signature`
    *   `salt`
    *   `timestamp`
    *   `Content-Type: application/json`
    *   `idempotency-key` (para solicitudes de escritura/POST).

### Patrón de Código Exacto (TypeScript)

```typescript
import crypto from 'crypto';

function generateRapydSignature(
  httpMethod: string,
  urlPath: string,
  salt: string,
  timestamp: string,
  body: any
): string {
  const accessKey = process.env.RAPYD_ACCESS_KEY!;
  const secretKey = process.env.RAPYD_SECRET_KEY!;
  let bodyString = '';

  if (body) {
    bodyString = typeof body === 'string' ? body : JSON.stringify(body);
  }

  const toSign = httpMethod.toLowerCase() + urlPath + salt + timestamp + accessKey + secretKey + bodyString;

  const hash = crypto.createHmac('sha256', secretKey);
  hash.update(toSign);
  const signature = Buffer.from(hash.digest('hex')).toString('base64');

  return signature;
}
```

## Checkout Flow (Hosted Checkout Page)

PicTik utiliza el modelo de Checkout Hospedado (Hosted Checkout) de Rapyd para minimizar el alcance PCI DSS.

*   **Creación de Sesión**: POST a `/v1/checkout`.
*   **Campos Obligatorios**:
    *   `amount`: Validado y extraído en el servidor según la suscripción.
    *   `currency`: Por ejemplo, `COP`, `MXN`, `USD`.
    *   `country`: Código de 2 letras, ej. `CO`, `MX`.
    *   `complete_checkout_url`: `/payment/status` (URL de retorno por éxito).
    *   `cancel_checkout_url`: `/checkout` o `/billing` (URL de retorno por cancelación).
    *   `merchant_reference_id`: ID interno de PicTik (ej. `subscription_id` o `order_id`).
*   **Regla de Rutas de Retorno**: *NUNCA* redirigir a rutas inexistentes (evitar configuraciones como `/dashboard/billing` si no existe).
*   **Respuesta y Cliente**: La API responde con un `redirect_url`. El cliente (React) recibe *únicamente* este `redirect_url` a través de tRPC. *Nunca* devolver objetos de sesión completos si contienen claves o metadata interna confidencial.
*   **Suscripciones**: Mapear los planes de PicTik a montos fijos de Rapyd, asegurando que el precio se asigne en el servidor y no en el payload del cliente.

## Métodos de Pago LATAM

El soporte geográfico de PicTik es primariamente latinoamericano. La configuración del checkout debe incluir los siguientes métodos soportados por Rapyd:

*   **Colombia**: PSE (transferencia bancaria), Tarjetas de Crédito/Débito, Nequi, Efecty.
*   **México**: OXXO (efectivo), SPEI (transferencia), Tarjetas de Crédito/Débito.
*   **Ecuador**: Transferencia bancaria local, Tarjetas de Crédito/Débito.
*   **Argentina**: Tarjetas de Crédito/Débito, Transferencia bancaria, Mercado Pago (si está habilitado vía Rapyd).
*   **Chile**: Tarjetas de Crédito/Débito, Transferencia bancaria, Webpay.
*   **Multi-moneda**: Soportar `COP`, `MXN`, `USD`, `ARS`, `CLP`.
*   **Detección de País**: Filtrar y pasar el código de país correcto en la creación del checkout basado en la configuración del usuario para mostrar los métodos locales correctos.

## Webhooks — Recepción y Procesamiento

El ciclo de vida del pago se cierra mediante notificaciones asíncronas de Rapyd.

*   **Endpoint**: Se requiere una ruta pura en Express, *NO* tRPC, alojada en `/api/webhooks/rapyd` debido a la necesidad de consumir el cuerpo sin procesar (raw body) para la validación de firmas.
*   **Validación de Firma (HMAC)**: Obligatorio comparar la firma enviada por Rapyd en los headers con el hash calculado localmente. Utilizar comparación de tiempo seguro (`crypto.timingSafeEqual`) para prevenir ataques de temporización (timing attacks).
*   **Idempotencia**: Antes de procesar, consultar la tabla `webhookEvents`. Si el `event_id` ya existe, retornar HTTP 200 (ya procesado) sin hacer nada.
*   **Persistencia Fallida**: Si la DB falla, retornar HTTP 500 para que Rapyd intente el reenvío.
*   **Eventos a Procesar**:
    *   `PAYMENT_COMPLETED` / `CHECKOUT_COMPLETED` → Activar la suscripción del usuario en la tabla `subscriptions`.
    *   `PAYMENT_FAILED` → Marcar como fallida, notificar al usuario.
    *   `PAYMENT_REFUND` → Procesar lógica de reembolso, degradar cuenta.
    *   `CHECKOUT_EXPIRED` → Limpiar la sesión pendiente en la base de datos.
*   **Almacenamiento**: Registrar en la tabla `webhookEvents`: `event_id`, `event_type`, `payment_id`, `status`, `raw_data`, y `processed_at`.
*   **Auditoría y Privacidad**: Hashear la IP de origen (`IP hashing`) en el log de auditoría para análisis sin almacenar PII puro.

## PCI DSS Compliance

*   **Nivel de Cumplimiento**: PicTik utiliza Hosted Checkout, calificando para **SAQ A** (el nivel más simple).
*   *NUNCA* manipular, almacenar, procesar o transmitir datos del titular de la tarjeta (PAN).
*   *NUNCA* hacer log de números de tarjeta, CVV, o fechas de expiración.
*   *NUNCA* crear formularios de pago personalizados nativos (React) que toquen los campos de la tarjeta.
*   Rapyd asume el alcance técnico de PCI DSS. La documentación interna debe reflejar esta exclusión de alcance por uso de pasarela externa y hospedada.

## Testing con Sandbox

El entorno de desarrollo siempre apunta al Sandbox de Rapyd.

*   **Tarjetas de Prueba**: Utilizar exclusivamente los números de tarjeta de prueba provistos en la documentación oficial de Rapyd.
*   **Flujos de Transferencia Bancaria**: Simular completados y fallos mediante el dashboard de Sandbox de Rapyd.
*   **Pruebas de Webhook**: Rapyd Sandbox envía webhooks reales si se configura un túnel (ej. ngrok) o usando herramientas locales.
*   **Cobertura Requerida**: La suite actual pasa con éxito (30/30). Todo nuevo desarrollo debe verificar el ciclo completo:
    *   Creación del checkout → Redirección → Pago exitoso → Recepción de webhook → Activación de la suscripción.
*   **Escenarios de Prueba Críticos**:
    *   Pago exitoso (`PAYMENT_COMPLETED`).
    *   Pago fallido o rechazado (`PAYMENT_FAILED`).
    *   Webhook duplicado (validación de Idempotencia).
    *   Expiración del checkout (`CHECKOUT_EXPIRED`).
    *   **Firma Inválida**: Forzar una firma mala y asegurar que el webhook rechace el payload (HTTP 401).

## Manejo de Errores

*   **Errores de la API de Rapyd**: Traducir y mapear los códigos de error técnicos a mensajes amigables para el usuario (en Español).
*   **Errores de Red**: Implementar reintentos (retry) con retraso exponencial (exponential backoff) para las llamadas a la API de Rapyd, con un máximo de 3 reintentos.
*   **Manejo en el Webhook**: Si la firma del webhook es inválida, hacer log del incidente como una posible brecha de seguridad y rechazar la solicitud (HTTP 401 o 400). *Nunca* procesar.
*   **Ausencia de Claves**: Si las claves `RAPYD_*` faltan al arrancar el servidor, este debe *fallar rápidamente* (fail fast). *Nunca* usar implementaciones simuladas o "fallback" en su lugar.
*   El adaptador *NO DEBE* redirigir a una sesión simulada en ningún caso.
*   **Logs Técnicos**: Registrar detalles de error de la red y códigos de estado sin exponer datos sensibles o secretos.

## Migración Sandbox → Producción

El paso a producción requiere un procedimiento riguroso.

**Checklist de Migración**:
1.  Reemplazar las claves de Sandbox por claves de Producción en el archivo `.env` del servidor.
2.  Actualizar la variable `RAPYD_BASE_URL` explícitamente a `https://api.rapyd.net`.
3.  Actualizar la URL del Webhook en el Dashboard de Rapyd para apuntar al dominio de producción (ej. `https://api.pictik.com/api/webhooks/rapyd`).
4.  Verificar que la validación de la firma del webhook esté utilizando las claves de producción.
5.  Realizar una transacción de prueba con dinero real (monto mínimo posible, ej. 1 USD) para verificar la conectividad de extremo a extremo (E2E).
6.  Monitorear intensamente las primeras 24 horas de transacciones de producción.
7.  Configurar alertas inmediatas para picos de pagos fallidos o errores de red.
8.  Asegurar que los procedimientos de reembolso (refunds) de producción estén documentados para el equipo de soporte.

*NUNCA* se deben mezclar claves de sandbox y producción (ej. `RAPYD_ACCESS_KEY` de prod con `RAPYD_SECRET_KEY` de dev o la URL base incorrecta). El sistema debe validar esto al arranque (validación de entorno).

## Reconciliación y Reportes

*   **Reconciliación Diaria**: Comparar los registros de la tabla `webhookEvents` con el export o los reportes del dashboard de Rapyd para identificar discrepancias (orphan checkouts, missed webhooks).
*   **Métricas a Rastrear**: Transacciones totales, tasa de éxito (success rate), pagos fallidos, volumen de reembolsos.
*   **Alertas Críticas**:
    *   Picos inusuales de `PAYMENT_FAILED`.
    *   Ausencia de webhooks tras horas pico (problemas de entrega de Rapyd).
    *   Fallas concurrentes de validación de firma (posible ataque o clave rota).
*   **Reportes Mensuales**: Generación de reportes de ingresos agrupados por nivel de suscripción de PicTik.

## Seguridad Específica de Pagos

*   **Verificación de Firma HMAC**: Obligatoria e innegociable en *cada* webhook recibido.
*   **Claves de Idempotencia (Idempotency keys)**: Usadas en *cada* solicitud de creación (POST) hacia la API de Rapyd para evitar cobros dobles si hay reintentos de red.
*   **Rate Limiting**: Aplicar límites estrictos de peticiones (rate limiting) en el endpoint (tRPC) de creación de checkout para evitar ataques de enumeración o fraude.
*   **Validación de Montos (Server-Side)**: El cliente *nunca* envía el monto. El cliente pide "Comprar Plan Pro". El servidor verifica en la base de datos el precio del "Plan Pro" y envía ese monto a Rapyd.
*   **Validación de Divisas**: Aceptar exclusivamente las monedas configuradas explícitamente y soportadas.
*   **Inmutabilidad de Precios en el Cliente**: Imposibilidad matemática de manipulación de precios desde el lado del cliente.

## Criterios de Salida

*   El sistema de checkout crea exitosamente una sesión real en el Sandbox de Rapyd.
*   El controlador de webhooks valida la firma HMAC del payload entrante sin falsos positivos ni negativos.
*   La lógica de idempotencia previene el procesamiento doble de webhooks idénticos.
*   Las respuestas de error de la API y de red *no* exponen claves de API ni secretos en los logs o al cliente.
*   Las URLs de retorno configuradas apuntan a páginas válidas y existentes en la aplicación de React.
*   La suite completa de tests de pago (30/30) ejecuta y pasa exitosamente.
*   Ninguna variable de entorno de Rapyd está expuesta utilizando el prefijo `VITE_`.

## Anti-patrones

*   **NUNCA** exponer `RAPYD_ACCESS_KEY` o `RAPYD_SECRET_KEY` al cliente (frontend).
*   **NUNCA** usar el prefijo `VITE_` para claves de Rapyd u otras variables sensibles.
*   **NUNCA** procesar un webhook de Rapyd sin validar exitosamente la firma HMAC.
*   **NUNCA** asumir que un webhook se entrega exactamente una vez (siempre implementar validación de idempotencia vía tabla `webhookEvents`).
*   **NUNCA** usar un checkout simulado (mock/fallback) en el flujo de aplicación si Rapyd no está disponible o faltan claves (el sistema debe fallar ruidosamente).
*   **NUNCA** almacenar datos de tarjeta de crédito (PAN, CVV, fecha de expiración) en la base de datos de PicTik.
*   **NUNCA** hacer log o guardar el cuerpo completo (raw payload) de las respuestas de pago si contienen datos personales no ofuscados (se deben sanitizar los logs).
*   **NUNCA** crear formularios de pago personalizados (React forms) que toquen o intercepten datos de tarjeta (rompe la exención PCI SAQ A).
*   **NUNCA** confiar o recibir el monto del pago directamente desde una variable o parámetro enviado por el cliente (el servidor debe dictar el precio).
*   **NUNCA** mezclar claves del entorno de sandbox con variables o URLs de producción y viceversa.
