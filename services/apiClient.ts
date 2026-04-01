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
    throw new ApiError(`Request failed with status ${response.status}`, response.status, text);
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
