import { API_BASE_URL } from '../constants/env';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type RequestOptions = {
  path: string;
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: BodyInit | null;
};

export class ApiError extends Error {
  status: number;
  responseText: string;

  constructor(message: string, status: number, responseText: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.responseText = responseText;
  }
}

function toReadableErrorMessage(status: number, url: string, responseText: string) {
  const normalizedResponse = String(responseText || '').trim();

  if (status === 401) {
    return 'Email o password incorrectos.';
  }

  if (status === 404) {
    return `No se encontro el servicio solicitado en ${url}.`;
  }

  if (status === 413) {
    return 'El archivo es demasiado grande. Prueba con uno de menos de 35 MB.';
  }

  if (status >= 500) {
    return 'El servidor tuvo un problema procesando la solicitud. Intenta de nuevo en unos minutos.';
  }

  if (normalizedResponse) {
    const compactText = normalizedResponse.replace(/\s+/g, ' ').slice(0, 220);
    return `Request failed with status ${status} en ${url}. Respuesta: ${compactText}`;
  }

  return `Request failed with status ${status} en ${url}.`;
}

function buildUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

export async function requestText({
  path,
  method = 'GET',
  headers,
  body,
}: RequestOptions) {
  const url = buildUrl(path);
  let response: Response;

  try {
    response = await fetch(url, {
      method,
      headers,
      body,
    });
  } catch {
    throw new Error(
      `No se pudo conectar con el backend en ${API_BASE_URL}. Si estas usando el telefono, localhost no funciona: necesitas una URL publica o un servidor accesible desde tu red.`
    );
  }

  const text = await response.text();

  if (!response.ok) {
    throw new ApiError(
      toReadableErrorMessage(response.status, url, text),
      response.status,
      text
    );
  }

  return text;
}

export async function requestJson<T>(options: RequestOptions): Promise<T> {
  const text = await requestText(options);
  return JSON.parse(text) as T;
}

export async function postJson<TResponse>(
  path: string,
  payload: unknown,
  headers?: Record<string, string>
) {
  return requestJson<TResponse>({
    path,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(payload),
  });
}

export async function postForm<TResponse>(
  path: string,
  formData: FormData,
  headers?: Record<string, string>
) {
  return requestJson<TResponse>({
    path,
    method: 'POST',
    headers,
    body: formData,
  });
}
