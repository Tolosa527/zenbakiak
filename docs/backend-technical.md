# Especificación backend: arquitectura técnica para una app educativa gamificada

## 1. Propósito y alcance

Este documento propone una base backend para construir una web app de
aprendizaje con formato de juego inspirada en patrones públicos observados en
Duolingo. No describe sistemas privados ni pretende afirmar detalles de las
APIs autenticadas de Duolingo.

La inspección se realizó sobre una sesión anónima de
`https://www.duolingo.com/`. Las conclusiones se separan entre observaciones
directas, inferencias de implementación y aspectos no observables.

## 2. Evidencia técnica observada

### 2.1 Entrega frontend

La página carga un shell HTML y recursos versionados desde un CDN CloudFront:

- CSS con nombres hash, incluyendo `app-f58b2376.css` y varios chunks
  específicos.
- JavaScript dividido en manifest, polyfills, `features`, `app` y chunks
  numéricos.
- Fuentes WOFF2 servidas desde el mismo CDN.
- Numerosos SVG y assets Lottie bajo `images/splash/` y `lottie/splash/`.
- `manifest.json` del origen principal.

El inventario pasivo `ev_08c9910a317f7877752691fc1960ca39603bc07d236681d274a79ecb81e61d5a`
reportó 30 scripts y 88 recursos en la ventana de observación. Los cuerpos de
red no forman parte de esa captura; por tanto, el inventario no permite
reconstruir payloads ni headers completos.

### 2.2 Integraciones observadas en carga pública

Durante la carga de la portada se observaron respuestas a:

| Endpoint observado | Uso probable |
|---|---|
| `/api/1/courses/list` | Catálogo público o datos iniciales de cursos |
| `/2023-05-23/config?fields=...` | Configuración versionada, feature flags y país |
| `/api/1/sync/batch` | Sincronización agrupada de eventos/estado del cliente |
| `/users/undefined/streak-goal-current` | Consulta de usuario no autenticado; respondió 404 |
| `/users/undefined/streak-goal-next-options` | Consulta relacionada con streak; respondió 404 |
| `zombie.duolingo.com/0/web.json?...` | Telemetría/heartbeat; respondió 404 en esta sesión |
| reCAPTCHA Enterprise | Protección de flujos sensibles |
| Google Identity Services | Dependencia para autenticación social |
| OneTrust | Consentimiento y configuración de cookies |

Estas rutas y estados provienen de la captura de escenario
`ev_196c0972acbf2e90e0fd6692722b78980f62c212357a7f51765846e887189802`.
Los endpoints de usuario no deben llamarse con `undefined` en la aplicación
propia: el cliente debe condicionar las consultas a una sesión válida.

### 2.3 Arquitectura de cliente inferida

La combinación de manifest, chunks hash, CSS por feature, assets Lottie y
configuración remota es consistente con una SPA con code splitting y carga
lazy de superficies. Es una inferencia de arquitectura, no una identificación
del framework.

El bundle también contiene candidatos estáticos para integraciones como
`/api/v1/sessions/math-tutor`; ese literal fue encontrado en JavaScript
capturado, pero no fue invocado en la sesión pública, por lo que no debe
considerarse contrato confirmado.

## 3. Arquitectura propuesta

### 3.1 Servicios

Para el MVP se recomienda un backend modular monolítico con límites claros:

1. **Identity**
   - Registro, login, refresh/revocación de sesión y proveedores OAuth.
2. **Catalog**
   - Cursos, unidades, lecciones, habilidades, idiomas y versiones.
3. **Learning**
   - Entrega de ejercicios, validación de respuestas y progreso.
4. **Gamification**
   - XP, niveles, streak, vidas/energía, logros y recompensas.
5. **Billing**
   - Planes, trial, suscripción y estado de entitlement.
6. **Telemetry**
   - Eventos de producto y métricas, separados de datos de aprendizaje.

Mantener estos módulos en un mismo despliegue al inicio reduce complejidad. La
separación permite extraer servicios cuando el volumen o el ownership lo
justifique.

### 3.2 Persistencia

Usar una base relacional para consistencia transaccional:

- `users`
- `sessions`
- `courses`
- `course_versions`
- `units`
- `lessons`
- `exercise_templates`
- `lesson_attempts`
- `user_lesson_progress`
- `user_streaks`
- `user_wallets` (XP, gemas, energía)
- `achievements`
- `user_achievements`
- `subscriptions`
- `consent_records`
- `product_events`

Un almacén de eventos o cola puede recibir telemetría y recalcular agregados,
pero el progreso confirmado debe tener una fuente de verdad transaccional.

## 4. Contrato HTTP recomendado

Adoptar REST versionado y respuestas JSON. El patrón `/api/1/...` observado
es una referencia útil, pero el producto debe documentar una versión propia.

### 4.1 Catálogo público

```http
GET /api/v1/courses
GET /api/v1/courses/{courseId}
GET /api/v1/courses/{courseId}/units
GET /api/v1/config
```

`GET /api/v1/config` debe devolver solo configuración pública y feature flags
permitidos para el cliente. No incluir secretos, reglas internas ni credenciales.

### 4.2 Identidad

```http
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
GET  /api/v1/me
```

- Access token de corta duración y refresh token rotatorio.
- Cookies `Secure`, `HttpOnly` y `SameSite=Lax` o `Strict` para sesión web.
- CSRF token para mutaciones si la sesión usa cookies.
- Respuestas de login genéricas para no revelar si un email existe.

### 4.3 Sesión de aprendizaje

```http
POST /api/v1/lessons/{lessonId}/sessions
GET  /api/v1/lesson-sessions/{sessionId}
POST /api/v1/lesson-sessions/{sessionId}/answers
POST /api/v1/lesson-sessions/{sessionId}/complete
GET  /api/v1/me/progress
```

El servidor debe emitir un `sessionId`, una secuencia de ejercicios y un
`attemptId` por respuesta. La puntuación final se calcula en servidor; el
cliente puede mostrar una proyección optimista, pero no confirma XP, streak o
recompensas sin respuesta validada.

### 4.4 Sincronización agrupada

El endpoint observado `/api/1/sync/batch` sugiere un patrón de sincronización
por lote. Para el producto propio:

```http
POST /api/v1/sync/batch
```

Payload recomendado:

```json
{
  "clientMutationId": "uuid",
  "operations": [
    {
      "type": "lesson.answer",
      "idempotencyKey": "uuid",
      "occurredAt": "2026-10-23T10:00:00Z",
      "payload": {}
    }
  ]
}
```

Reglas:

- Procesar cada operación de forma idempotente.
- Devolver resultado por operación, no fallar silenciosamente todo el lote.
- Rechazar operaciones fuera de orden con un código explícito.
- No aceptar desde el cliente el valor final de XP, streak o saldo.
- Registrar `serverVersion` o cursor para resolver sincronización offline.

## 5. Estado de juego

### Streak

- Guardar zona horaria de usuario y fecha local de actividad.
- Actualizar en transacción al completar una lección válida.
- Definir explícitamente gracia, reparación y límites diarios.
- Exponer:

```http
GET /api/v1/me/streak
POST /api/v1/me/streak/repair
```

### XP y recompensas

- Registrar movimientos en un ledger inmutable:
  `xp_ledger(user_id, source, amount, reference_id, created_at)`.
- Calcular el saldo a partir del ledger o de un agregado verificable.
- No confiar en un contador enviado por el navegador.
- Aplicar límites y deduplicación por `reference_id`.

### Energía, vidas y consumibles

- Mantener el saldo en servidor.
- Reservar o consumir en la misma transacción que la respuesta de ejercicio.
- Evitar que reintentos de red consuman dos veces el mismo recurso mediante
  idempotency keys.

## 6. Seguridad, privacidad y observabilidad

- HTTPS obligatorio y CSP estricta para la aplicación.
- Rate limiting por IP, cuenta y endpoint sensible.
- Validar tamaño, tipo y rango de todo payload.
- Sanitizar texto generado por usuarios antes de renderizarlo.
- Proteger OAuth y reCAPTCHA detrás de adaptadores; no acoplar el dominio a un
  proveedor.
- Registrar consentimiento con versión de política, timestamp, región y
  finalidad.
- No enviar respuestas de ejercicios o datos de aprendizaje a proveedores
  analíticos sin una base legal y configuración de consentimiento.
- Separar logs de auditoría, métricas operativas y eventos de producto.
- Correlation ID en cada request; no registrar tokens ni contenido sensible.

## 7. Rendimiento y operación

- Servir assets estáticos con hash y `Cache-Control: immutable`.
- CDN para CSS, JS, fuentes e ilustraciones.
- Dividir bundles por ruta/producto y cargar Lottie bajo demanda.
- Cachear catálogo público con TTL y versión explícita.
- Usar compresión Brotli/Gzip y HTTP/2 o HTTP/3.
- Health checks separados de readiness y liveness.
- Medir p95/p99 de:
  - inicio de sesión de lección,
  - validación de respuesta,
  - sincronización batch,
  - lectura de progreso.
- Reintentos solo para operaciones seguras o con idempotency key.

## 8. Límites de esta investigación

- No se inició sesión ni se enviaron credenciales.
- No se observó una lección autenticada ni sus payloads de respuesta.
- REA omitió cuerpos, valores de cookies, headers completos y payloads de
  WebSocket en las capturas utilizadas.
- Los nombres hash de bundles cambian con los despliegues.
- Las afirmaciones sobre `/api/v1/sessions/math-tutor` son candidatos estáticos,
  no tráfico observado.
- Las respuestas 404 de endpoints asociados a `undefined` reflejan una sesión
  anónima y no prueban el comportamiento autenticado.

## 9. Criterios de aceptación backend

- Un usuario anónimo puede consultar catálogo y configuración pública sin crear
  una sesión.
- Una sesión autenticada puede iniciar una lección, enviar respuestas y
  finalizarla de forma idempotente.
- XP, streak, energía y recompensas solo cambian tras una validación de servidor.
- La repetición de una request con la misma idempotency key no duplica efectos.
- La sincronización batch devuelve éxito/error por operación y un cursor de
  servidor.
- Consentimiento, OAuth, rate limiting y auditoría están cubiertos por pruebas.
- Los endpoints públicos y autenticados están documentados con OpenAPI.

