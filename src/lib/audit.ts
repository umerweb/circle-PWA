import { query } from './db';

export interface AuditLogEntry {
  action: string;
  entityType: string;
  entityId?: string | null;
  actorId?: string | null;
  actorEmail?: string | null;
  details?: Record<string, any> | null;
}

export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  try {
    await query(
      `
      INSERT INTO public.audit_logs (
        action, entity_type, entity_id, actor_id, actor_email, details
      )
      VALUES ($1, $2, $3, $4, $5, $6)
    `,
      [
        entry.action,
        entry.entityType,
        entry.entityId || null,
        entry.actorId || null,
        entry.actorEmail || 'system@circlefund.internal',
        entry.details ? JSON.stringify(entry.details) : null,
      ]
    );
  } catch (error) {
    console.error('Failed to write audit log entry:', error);
  }
}
