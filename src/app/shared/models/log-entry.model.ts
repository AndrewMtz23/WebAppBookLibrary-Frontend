// 📁 shared/models/log-entry.model.ts
export interface LogEntry {
  id?: string;
  timestamp: string | Date;
  level: 'error' | 'warn' | 'warning' | 'info' | 'debug' | string;
  message: string;
  username?: string;
  userId?: string;
  module?: string; // ✅ Módulo que generó el log
  action?: string; // ✅ Acción realizada
  details?: any; // ✅ Detalles adicionales
  ip?: string; // ✅ IP del usuario
  userAgent?: string; // ✅ User agent
}