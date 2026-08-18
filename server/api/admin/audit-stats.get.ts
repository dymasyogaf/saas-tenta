import { serverSupabaseServiceRole } from '#supabase/server'
import { getChartDateLabel, getStartOfDay, getEndOfDay } from '../../utils/date'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const supabase = serverSupabaseServiceRole<any>(event)

  try {
    const now = new Date()
    const todayStart = getStartOfDay(now)
    const todayEnd = getEndOfDay(now)

    // 7 hari ke belakang untuk chart trend
    const sevenDaysAgo = getStartOfDay(new Date(now.setDate(now.getDate() - 6)))

    // ─── 1. KYC PENDING (antrean aktif) ─────────────────────────────────────
    const { count: kycPending } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('verification_status', 'pending')

    // ─── 2. KYC DISETUJUI HARI INI ──────────────────────────────────────────
    const { count: kycApprovedToday } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('verification_status', 'verified')
      .gte('updated_at', todayStart.toISOString())
      .lte('updated_at', todayEnd.toISOString())

    // ─── 3. KYC DITOLAK HARI INI ────────────────────────────────────────────
    const { count: kycRejectedToday } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('verification_status', 'rejected')
      .gte('updated_at', todayStart.toISOString())
      .lte('updated_at', todayEnd.toISOString())

    // ─── 4. BELUM SUBMIT KYC (registered tapi unverified) ───────────────────
    const { count: kycNeverSubmitted } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('verification_status', 'unverified')

    // ─── 5. DATA UNTUK GRAFIK TREND 7 HARI ──────────────────────────────────
    // Ambil semua users yang updated dalam 7 hari (approved/rejected = diselesaikan)
    const { data: kycTrendData } = await supabase
      .from('users')
      .select('verification_status, created_at, updated_at')
      .in('verification_status', ['pending', 'verified', 'rejected'])
      .gte('created_at', sevenDaysAgo.toISOString())

    // Bangun data chart per hari
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

    const chartLabels: string[] = []
    const kycMasukPerHari: number[] = []
    const kycSelesaiPerHari: number[] = []

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(now.getDate() - i)

      const label = getChartDateLabel(d)
      chartLabels.push(label)

      const dStart = getStartOfDay(d)
      const dEnd = getEndOfDay(d)

      // KYC masuk: created_at di hari ini
      const masuk = kycTrendData?.filter((u: any) => {
        const c = new Date(u.created_at)
        return c >= dStart && c <= dEnd
      }).length || 0

      // KYC selesai: updated_at di hari ini dan sudah verified/rejected
      const selesai = kycTrendData?.filter((u: any) => {
        if (!['verified', 'rejected'].includes(u.verification_status)) return false
        const uDate = new Date(u.updated_at)
        return uDate >= dStart && uDate <= dEnd
      }).length || 0

      kycMasukPerHari.push(masuk)
      kycSelesaiPerHari.push(selesai)
    }

    // ─── 6. ANTREAN KYC TERBARU (activity feed) ─────────────────────────────
    const { data: recentKyc } = await supabase
      .from('users')
      .select('id, full_name, email, phone, verification_status, updated_at, created_at')
      .eq('verification_status', 'pending')
      .order('updated_at', { ascending: false })
      .limit(5)

    // ─── 7. REQUEST AKUN IKLAN ───────────────────────────────────────────────
    const { count: requestPending } = await supabase
      .from('ad_account_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending_review')

    const { count: requestApprovedToday } = await supabase
      .from('ad_account_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved')
      .gte('updated_at', todayStart.toISOString())
      .lte('updated_at', todayEnd.toISOString())

    const { data: recentRequests } = await supabase
      .from('ad_account_requests')
      .select('id, platform, account_name, status, created_at, users(full_name, email)')
      .eq('status', 'pending_review')
      .order('created_at', { ascending: false })
      .limit(5)

    // ─── 8. SUPPORT TICKETS (Butuh Delegasi) ─────────────────────────────────
    const { count: supportTickets } = await supabase
      .from('support_tickets')
      .select('*', { count: 'exact', head: true })
      .is('assigned_to_role', null)
      .neq('status', 'closed')

    return {
      // KYC Stats
      kycPending: kycPending || 0,
      kycApprovedToday: kycApprovedToday || 0,
      kycRejectedToday: kycRejectedToday || 0,
      kycNeverSubmitted: kycNeverSubmitted || 0,
      
      // Support Stats
      supportTickets: supportTickets || 0,

      // Chart Trend
      chartLabels,
      kycChartSeries: [
        { name: 'KYC Masuk', data: kycMasukPerHari },
        { name: 'Diselesaikan', data: kycSelesaiPerHari }
      ],

      // Activity Feeds
      recentKyc: recentKyc || [],

      // Request Akun
      requestPending: requestPending || 0,
      requestApprovedToday: requestApprovedToday || 0,
      recentRequests: recentRequests || []
    }
  } catch (error: any) {
    console.error('Error fetching audit stats:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Gagal mengambil data statistik audit'
    })
  }
})
