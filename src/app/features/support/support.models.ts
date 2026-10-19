export interface SupportPage<T> { items: T[]; page: number; pageSize: number; totalItems: number; totalPages: number; hasNextPage: boolean; hasPreviousPage: boolean; }
export interface TicketSummary { id: string; category: string; subject: string; status: string; version: number; createdAt: string; updatedAt: string; }
export interface SupportMessage { id: string; author: string; text: string; createdAt: string; }
export interface TicketDetail extends TicketSummary { description: string; bookId: string | null; resolvedAt: string | null; reopenUntil: string | null; replies: SupportPage<SupportMessage>; }
export interface StaffDetail { ticket: TicketDetail; assigneeId: string | null; notes: SupportPage<SupportMessage>; history: SupportPage<{ id: string; action: string; fromStatus: string; toStatus: string; reason: string; createdAt: string }>; }
export interface NewTicket { category: string; subject: string; description: string; idempotencyKey: string; bookId?: string; loanId?: string; }
export interface Assignee { id: string; name: string; }
export const CATEGORY_LABELS: Record<string, string> = { account: 'Cuenta', loan: 'Préstamos', catalog: 'Catálogo', technical: 'Problema técnico' };
export const STATUS_LABELS: Record<string, string> = { open: 'Abierta', in_progress: 'En atención', resolved: 'Resuelta', closed: 'Cerrada' };
export function supportError(e: { status?: number; error?: { detail?: string } }): string {
  if (e.status === 409) return e.error?.detail ?? 'La solicitud cambió. Actualiza antes de volver a enviar; conservamos tu borrador.';
  return e.error?.detail ?? (e.status === 403 ? 'No tienes permiso para esta operación.' : e.status === 404 ? 'La solicitud no está disponible.' : e.status === 401 ? 'Inicia sesión con una cuenta activa.' : 'No pudimos confirmar la operación. Conservamos tu borrador; vuelve a intentarlo.');
}
