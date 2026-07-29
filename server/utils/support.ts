import type { SupabaseClient } from '@supabase/supabase-js'

export const fetchTicketDetails = async (supabase: SupabaseClient<any>, ticketId: string, isAdmin: boolean = false) => {
  // Get ticket details
  const query = supabase.from('support_tickets').select(isAdmin ? '*, users(full_name, email)' : '*').eq('id', ticketId).single()
  const { data: ticket, error: ticketError } = await query

  if (ticketError) throw ticketError
  
  // Get replies
  const { data: replies, error: repliesError } = await supabase
    .from('ticket_replies')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true })

  if (repliesError) throw repliesError

  return {
    ...(ticket as any),
    replies: replies || []
  }
}
