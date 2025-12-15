

import { checkAndHandleAuthError } from './authErrorHandler';

export interface BackendError {
  message?: string;
  detail?: string;
  error?: string;
  details?: Record<string, string[] | string>;
  non_field_errors?: string[] | string;
  [key: string]: unknown;
}


export const parseApiError = async (
  response: Response,
  defaultMessage: string = 'Error en la operación'
): Promise<Error> => {

  if (response.status >= 500) {
    let errorText = await response.text();

    if (errorText.includes('<!DOCTYPE html>') || errorText.includes('<html')) {
      const exceptionMatch = errorText.match(/<pre class="exception_value">([^<]+)<\/pre>/);
      if (exceptionMatch) {
        errorText = exceptionMatch[1].trim();
      } else {
        const titleMatch = errorText.match(/<title>([^<]+)<\/title>/);
        if (titleMatch) {
          errorText = titleMatch[1].trim();
        } else {
          errorText = 'Error interno del servidor. Revisa los logs del backend para más detalles.';
        }
      }
    } else {
      try {
        const errorJson: BackendError = JSON.parse(errorText);
        errorText = errorJson.detail || errorJson.message || errorJson.error || errorText;
      } catch {
        if (errorText.length > 500) {
          errorText = errorText.substring(0, 500) + '...';
        }
      }
    }
    
    return new Error(
      `Error del servidor (${response.status}): ${errorText}. Por favor, intenta nuevamente más tarde o contacta al administrador.`
    );
  }

  if (response.status === 401) {
    checkAndHandleAuthError(response);
    return new Error('No estás autenticado. Por favor, inicia sesión nuevamente.');
  }

  if (response.status === 403) {
    return new Error('No tienes permisos para realizar esta operación.');
  }

  if (response.status === 404) {
    return new Error('El recurso solicitado no fue encontrado.');
  }

  if (response.status === 405) {
    return new Error('Método HTTP no permitido para esta operación.');
  }

  const fallback: BackendError = { message: defaultMessage };
  let error: BackendError;
  
  try {
    error = await response.json();
  } catch {
    error = fallback;
  }

  const errorMessages: string[] = [];

  if (error.message && error.message !== 'Error en la petición' && !errorMessages.includes(error.message)) {
    errorMessages.push(error.message);
  }
  if (error.detail && !errorMessages.includes(error.detail)) {
    errorMessages.push(error.detail);
  }
  if (error.error && typeof error.error === 'string' && !errorMessages.includes(error.error)) {
    errorMessages.push(error.error);
  }

  if (error.non_field_errors) {
    const nonFieldErrors = Array.isArray(error.non_field_errors)
      ? error.non_field_errors
      : [error.non_field_errors];
    nonFieldErrors.forEach((err: string) => {
      if (typeof err === 'string' && !errorMessages.includes(err)) {
        errorMessages.push(err);
      }
    });
  }

  if (error.details && typeof error.details === 'object') {
    Object.keys(error.details).forEach((key) => {
      if (
        key !== 'message' &&
        key !== 'detail' &&
        key !== 'error' &&
        key !== 'non_field_errors' &&
        error.details?.[key]
      ) {
        const fieldError = Array.isArray(error.details[key])
          ? error.details[key][0]
          : error.details[key];
        if (typeof fieldError === 'string' && !errorMessages.includes(fieldError)) {
          errorMessages.push(fieldError);
        }
      }
    });
  }


  if (errorMessages.length === 0) {
    Object.keys(error).forEach((key) => {
      if (
        key !== 'message' &&
        key !== 'detail' &&
        key !== 'error' &&
        key !== 'details' &&
        key !== 'non_field_errors' &&
        error[key]
      ) {
        const fieldError = Array.isArray(error[key]) ? error[key][0] : error[key];
        if (typeof fieldError === 'string' && !errorMessages.includes(fieldError)) {
          errorMessages.push(`${key}: ${fieldError}`);
        }
      }
    });
  }

  if (errorMessages.length === 0) {
    errorMessages.push(
      'Error en la operación. Verifica que todos los campos obligatorios estén completos.'
    );
  }

  return new Error(errorMessages.join('. '));
};


export const handleNetworkError = (error: unknown): never => {
  if (error instanceof TypeError) {
    if (
      error.message.includes('fetch') ||
      error.message.includes('Failed to fetch') ||
      error.message.includes('NetworkError') ||
      error.message.includes('ERR_CONNECTION_REFUSED') ||
      error.message.includes('ERR_NETWORK') ||
      error.message.includes('Network request failed')
    ) {
      throw new Error(
        'No se pudo conectar con el servidor. Verifica tu conexión a internet y que el backend esté ejecutándose.'
      );
    }
  }
  if (error instanceof Error) {
    throw error;
  }
  throw new Error('Error desconocido al realizar la operación');
};


export const withApiErrorHandling = async <T>(
  fn: () => Promise<T>,
  customErrorHandler?: (error: unknown) => never
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (customErrorHandler) {
      customErrorHandler(error);
    }
    handleNetworkError(error);
    throw error;
  }
};


