import { HttpErrorResponse } from '@angular/common/http';
import { toApiError } from './api-error';
describe('API error mapping', () => {
  it('uses safe problem details', () => {
    const error = new HttpErrorResponse({ status: 400, error: { title: 'Solicitud inválida' } });
    expect(toApiError(error).message).toBe('Solicitud inválida');
  });
  it('hides empty 500 status text', () => expect(toApiError(new HttpErrorResponse({ status: 500, statusText: 'SQL secret' })).message).toBe('Ocurrió un error al procesar la solicitud.'));
});
