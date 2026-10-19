export interface PublicReview { id:string; displayName:string; rating:number; text:string; createdAt:string; updatedAt:string; }
export interface PublicReviewPage { items:PublicReview[]; page:number; pageSize:number; total:number; averageRating:number|null; }
export interface MyReview { id:string; bookId:string; rating:number|null; text:string; visibility:'visible'|'hidden'|'removed'; version:number; moderationReason:string|null; }
export interface ReviewPage<T> { items:T[]; page:number; pageSize:number; totalItems:number; totalPages:number; }
export interface ReviewHistory { id:string; action:string; reason:string; createdAt:string; }
export interface AdminReviewDetail { review:MyReview; history:ReviewPage<ReviewHistory>; }
export interface ReviewReport { id:string; reviewId:string; reason:string; status:string; version:number; resolution:string|null; resolutionReason:string|null; createdAt:string; resolvedAt:string|null; }
export function reviewError(e: { error?: { detail?:string }; status?:number }):string { return e.error?.detail ?? (e.status===409?'El contenido cambió. Actualiza antes de enviar nuevamente.':'No pudimos completar la operación. Intenta nuevamente.'); }
export const REVIEW_STATES:Record<string,string>={visible:'Publicada',hidden:'Oculta por moderación',removed:'Retirada'};
