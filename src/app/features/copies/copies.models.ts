export type CopyStatus = 'available' | 'held' | 'loaned' | 'maintenance' | 'lost' | 'retired';
export type CopyCondition = 'good' | 'worn' | 'damaged';
export interface CopyResponse { assignmentVersion?: number | null; readerDisplayName?: string | null; id: string; bookId: string; inventoryCode: string; status: CopyStatus; condition: CopyCondition | null; inspectionPending: boolean; location: string | null; notes: string | null; version: number; createdAt: string; updatedAt: string; activeAssignmentType: string | null; activeAssignmentId: string | null; }
export interface CopyPage { items: CopyResponse[]; totalCount: number; page: number; pageSize: number; stateCounts?: Partial<Record<string, number>>; }
export interface CopyHistory { id: string; action: string; fromStatus: string | null; toStatus: string; actorId: string | null; reason: string | null; createdAt: string; }
export interface CopyInspection { condition: CopyCondition; location: string | null; notes: string | null; }
export interface CopySelection { copyId: string; expectedVersion: number; }
export interface CopyReturnRequest { copy: CopySelection; inspection: CopyInspection; idempotencyKey: string; }
export const COPY_STATES: Record<CopyStatus, string> = { available: 'Disponible', held: 'Retenido', loaned: 'Prestado', maintenance: 'Mantenimiento', lost: 'Perdido', retired: 'Dado de baja' };
export const COPY_CONDITIONS: Record<CopyCondition, string> = { good: 'Buen estado', worn: 'Desgastado', damaged: 'Dañado' };
export function copyError(error: { status?: number }): string { return error.status === 409 ? 'El ejemplar cambió o esta operación ya no está disponible. Recarga la ficha antes de continuar.' : error.status === 403 ? 'No tienes permiso para esta operación.' : 'No pudimos confirmar la operación. Revisa el estado e intenta de nuevo.'; }
