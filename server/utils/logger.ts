import { createConsola } from 'consola'
import { serverSupabaseServiceRole } from '#supabase/server'
import type { H3Event } from 'h3'

export const logger = createConsola({
  level: 4, // Info and above
})

export async function logAudit(event: H3Event, params: {
  userId?: string,
  action: string,
  entityType: string,
  entityId?: string,
  details?: Record<string, any>
}) {
  try {
    const supabaseAdmin = serverSupabaseServiceRole<any>(event)
    await supabaseAdmin.from('audit_logs').insert({
      user_id: params.userId,
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId,
      details: params.details
    })
    logger.info(`[AUDIT] ${params.action} on ${params.entityType} ${params.entityId || ''}`)
  } catch (err) {
    logger.error('Failed to write audit log:', err)
  }
}
