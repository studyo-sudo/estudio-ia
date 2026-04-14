# Backend starter

Backend local para desarrollo de Studyo Ai.

## Que incluye

- `POST /auth/login`
- `POST /auth/register`
- `GET /auth/me`
- `POST /history/sync/push`
- `GET /history/sync/pull`
- `GET /billing/state`
- `POST /billing/state`
- `POST /analyze-file`
- `POST /analyze-image`
- `POST /analyze-audio`
- `POST /analyze-exam-model`
- `POST /analyze-problem`
- `POST /tutor/chat`
- `GET /health`

## Uso

1. Instalar dependencias:

```bash
cd backend
npm install
```

2. Configurar variables:

```bash
copy .env.example .env
```

3. Iniciar:

```bash
npm run dev
```

Tambien puedes iniciarlo desde la raiz:

```bash
npm run backend:start
```

## Deploy en Render

El repo ya incluye `render.yaml` para crear un Web Service en Render.

Configuracion esperada:

- Root directory: `backend`
- Build command: `npm install`
- Start command: `npm start`
- Health check: `/health`

Variables importantes:

- `OPENAI_API_KEY`
- `DATABASE_URL`
- `AUTH_TOKEN_SECRET`
- `OPENAI_PDF_MODEL` (opcional, por defecto `gpt-4o-mini`)

Cuando Render te de una URL fija `https://...onrender.com`, usa esa URL como
`EXPO_PUBLIC_API_BASE_URL` en la app para dejar de depender de `ngrok`.

## Credenciales demo

- Email: `demo@studyoai.local`
- Password: `demo1234`

Puedes cambiarlas desde variables de entorno.
Tambien puedes registrar usuarios locales nuevos desde la app o via API.

## Persistencia

Los datos se guardan en `backend/data/users/*.json`.

## Alcance

Este backend no usa IA real ni pasarela de pagos real. Sirve como base compatible con la app para desarrollar la capa externa, validar contratos y despues reemplazar implementaciones por servicios productivos.

## Archivos soportados

`POST /analyze-file` acepta:

- `.pdf`
- `.txt`
- `.md`
- `.csv`
- `.json`
- `.xml`
- `.html`

## Limites practicos

- En subidas directas de archivo, el backend admite hasta aproximadamente `35 MB`.
- En movil, los documentos se envian como base64, asi que el limite practico real suele ser un poco menor que el peso original del archivo.
- Si aparece `413 Payload Too Large`, el archivo supero ese limite y conviene reducirlo o dividirlo.
