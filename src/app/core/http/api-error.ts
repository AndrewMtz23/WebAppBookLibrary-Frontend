import { HttpErrorResponse } from '@angular/common/http';
export class ApiError extends Error { constructor(public readonly status: number, message: string, public readonly code?: string) { super(message); } }
export function toApiError(error: HttpErrorResponse): ApiError {
  const body = error.error;
  const validation = body?.errors ? Object.values(body.errors).flat().find(value => typeof value === 'string') : null;
  const message = validation as string || body?.detail || body?.title || (error.status === 0 ? 'No fue posible conectar con el servidor.' : 'Ocurrió un error al procesar la solicitud.');
  return new ApiError(error.status, message, typeof body?.code === 'string' ? body.code : undefined);
}
