import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody(event)
  const { ticket_id, status, assigned_to_role } = body
  
  if (!ticket_id) {
    throw createError({ statusCode: 400, statusMessage: 'Ticket ID wajib diisi' })
  }

  const supabase = serverSupabaseServiceRole<any>(event)
  const user = await requireAdmin(event)
  const userRole = user.user_metadata?.role as string
  
  const updateData: any = { updated_at: new Date().toISOString() }
  if (status) updateData.status = status
  
  if (assigned_to_role !== undefined) {
    if (userRole === 'super_admin' || userRole === 'admin_compliance') {
      updateData.assigned_to_role = assigned_to_role || null
    } else {
      throw createError({ statusCode: 403, statusMessage: 'Hanya Tim Audit yang bisa mendelegasikan tiket.' })
    }
  }

  if (Object.keys(updateData).length === 1) {
    return { success: true, message: 'Tidak ada perubahan' }
  }
  
  try {
    const { error } = await supabase
      .from('support_tickets')
      .update(updateData)
      .eq('id', ticket_id)

    if (error) throw error

    return { success: true, message: 'Data tiket berhasil diperbarui' }
  } catch (error: any) {
    console.error('Error updating ticket status:', error)
    throw createError({
      statusCode: 400,
      statusMessage: error.message || 'Gagal memperbarui tiket'
    })
  }
})

