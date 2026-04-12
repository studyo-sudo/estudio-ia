# Studyo Ai

App mobile hecha con Expo y React Native para convertir material de estudio en recursos utiles:

- PDFs o archivos de texto a resumen, preguntas, flashcards y examen
- Imagenes con texto a material de estudio
- Audio grabado a transcripcion resumida y examen
- Fotos de examenes anteriores a un nuevo modelo de examen
- Historial local de contenido generado

## Stack

- Expo 55
- React 19
- React Native 0.83
- Expo Router
- AsyncStorage
- RevenueCat para billing nativo

## Variables de entorno

Usa `.env` a partir de [.env.example](C:/Users/Ismael/estudio-ia/.env.example).

- `EXPO_PUBLIC_API_BASE_URL`: URL base del backend
- `EXPO_PUBLIC_RC_ANDROID_API_KEY`: API key de RevenueCat para Android
- `EXPO_PUBLIC_RC_IOS_API_KEY`: API key de RevenueCat para iOS
- `EXPO_PUBLIC_RC_PREMIUM_ENTITLEMENT_ID`: entitlement usado para detectar Premium
- `EXPO_PUBLIC_RC_OFFERING_ID`: offering usado para Premium
- `EXPO_PUBLIC_RC_CREDITS_OFFERING_ID`: offering usado para creditos
- `EXPO_PUBLIC_RC_CREDITS_BASIC_PRODUCT_ID`: producto de creditos basicos
- `EXPO_PUBLIC_RC_CREDITS_MEDIUM_PRODUCT_ID`: producto de creditos medianos
- `EXPO_PUBLIC_RC_CREDITS_LARGE_PRODUCT_ID`: producto de creditos grandes

## Scripts

```bash
npm install
npx expo start
npm run android
npm run web
npm run lint
npx tsc --noEmit
npm test
npm run backend:start
```

## Backend local

Hay un backend starter listo en [backend/README.md](C:/Users/Ismael/estudio-ia/backend/README.md).

Con eso ya puedes levantar auth, sync y endpoints de analisis compatibles con la app sin esperar a infraestructura final.

## Estado actual

- El proyecto compila sin errores de TypeScript.
- Las compras de Premium y creditos se resuelven con RevenueCat y Google Play.
- El historial se guarda localmente en AsyncStorage.

## Backend esperado

La app consume estos endpoints:

- `POST /analyze-file`
- `POST /analyze-image`
- `POST /analyze-audio`
- `POST /analyze-exam-model`
- `POST /auth/login`
- `POST /history/sync/push`
- `GET /history/sync/pull`

La definicion de contratos y necesidades externas esta documentada en [docs/infrastructure.md](C:/Users/Ismael/estudio-ia/docs/infrastructure.md).

## Recomendaciones para seguir

- Agregar autenticacion visible en la UI
- Sumar tests para servicios y flujos principales
