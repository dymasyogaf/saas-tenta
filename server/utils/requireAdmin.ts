import { serverSupabaseUser } from '#supabase/server'
import type { H3Event } from 'h3'

export async function requireAdmin(event: H3Event, allowedRoles?: string[]) {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const role = user.user_metadata?.role as string | undefined

  if (!role || role === 'client') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden: akses khusus admin' })
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (role !== 'super_admin' && !allowedRoles.includes(role)) {
      throw createError({ statusCode: 403, statusMessage: 'Forbidden: role tidak memiliki akses' })
    }
  }

  return user
}
