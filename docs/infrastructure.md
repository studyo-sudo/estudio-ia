# Infraestructura esperada

Esta app de Studyo Ai ya esta preparada para integrarse con servicios externos reales. Este documento resume lo que debe existir fuera del repositorio para evitar retrabajo.

Nota:

- El repo ya incluye un backend starter funcional en [backend/README.md](C:/Users/Ismael/estudio-ia/backend/README.md).
- Ese backend cubre auth, sync, billing basico y analisis de desarrollo con respuestas compatibles.
- Cuando llegue la infraestructura final, la idea es reemplazar implementaciones internas, no rediseñar contratos desde cero.

## Variables de entorno de la app

- `EXPO_PUBLIC_API_BASE_URL`
- `EXPO_PUBLIC_ENABLE_FAKE_ADS`
- `EXPO_PUBLIC_ENABLE_FAKE_BILLING`
- `EXPO_PUBLIC_RC_ANDROID_API_KEY`
- `EXPO_PUBLIC_RC_IOS_API_KEY`
- `EXPO_PUBLIC_RC_PREMIUM_ENTITLEMENT_ID`

## Contratos HTTP esperados

### `POST /auth/login`

Request:

```json
{
  "email": "user@example.com",
  "password": "secret"
}
```

Response:

```json
{
  "token": "jwt-or-session-token"
}
```

### `POST /history/sync/push`

Headers:

- `Authorization: Bearer <token>`

Request:

```json
{
  "items": []
}
```

Response:

- Cualquier `2xx` con body de texto o JSON.

### `GET /history/sync/pull`

Headers:

- `Authorization: Bearer <token>`

Response:

```json
{
  "items": []
}
```

### `POST /analyze-file`

Multipart form-data:

- `file`

### `POST /analyze-image`

Multipart form-data:

- `image`

### `POST /analyze-audio`

Multipart form-data:

- `audio`

### `POST /analyze-exam-model`

Multipart form-data:

- `images` una o varias veces

## Contrato de respuesta para analisis de estudio

Usado por archivo, imagen y audio.

```json
{
  "summary": "string",
  "questions": ["string"],
  "flashcards": [
    {
      "front": "string",
      "back": "string"
    }
  ],
  "exam": [
    {
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "correctAnswer": "string"
    }
  ]
}
```

Notas:

- `summary` es obligatorio.
- `questions`, `flashcards` y `exam` pueden omitirse; la app ya tiene fallbacks locales.

## Contrato de respuesta para modelo de examen

```json
{
  "detectedTopics": ["string"],
  "examStyle": "string",
  "estimatedQuestions": 10,
  "generatedExam": {
    "questions": [
      {
        "question": "string",
        "options": ["string", "string", "string", "string"],
        "correctAnswer": "string"
      }
    ]
  }
}
```

## Billing recomendado

La app ya soporta dos modos:

- Demo local con `EXPO_PUBLIC_ENABLE_FAKE_BILLING=true`
- RevenueCat real con API keys cargadas

Para pasar a produccion:

1. Crear productos y entitlement `premium` en RevenueCat.
2. Configurar claves iOS y Android.
3. Definir si los creditos viven en backend, en RevenueCat consumables o en ambos.
4. Si los creditos viven en backend, exponer endpoints para saldo, compra y consumo.

El backend starter ya deja preparados endpoints de billing basico para que luego solo cambie la implementacion real.

## Siguientes integraciones recomendadas

- Observabilidad: Sentry o similar para errores de red y fallos de analisis.
- Auth robusta: refresh token o expiracion controlada.
- Sync incremental: versionado o `updatedAt` por item para reducir payload.
- Tests E2E: backend mockeado o staging con datos controlados.
