import { defineStore } from 'pinia'

export const useSaldoStore = defineStore('saldo', {
  state: () => ({
    balance: 0,
    pendingBalance: 0,
    transactions: [] as any[],
    isLoading: false,
    error: null as string | null
  }),

  actions: {
    async fetchSaldo() {
      const user = useSupabaseUser()
      if (!user.value) return

      const supabase = useSupabaseClient<any>()
      
      try {
        const uid = user.value.id || (user.value as any).sub
        const { data, error } = await supabase
          .from('saldo')
          .select('balance, pending_balance')
          .eq('user_id', uid)
          .single()
          
        if (error) throw error
        
        if (data) {
          this.balance = data.balance
          this.pendingBalance = data.pending_balance
        }
      } catch (e: any) {
        console.error('Failed to fetch saldo:', e.message)
      }
    },

    async fetchTransactions() {
      const user = useSupabaseUser()
      if (!user.value) return
      
      const supabase = useSupabaseClient<any>()
      
      try {
        const uid = user.value.id || (user.value as any).sub
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', uid)
          .order('created_at', { ascending: false })
          
        if (error) throw error
        
        if (data) {
          this.transactions = data as any[]
        }
      } catch (e: any) {
        console.error('Failed to fetch transactions:', e.message)
      }
    },

    async topup(amount: number, userValue: any, method?: string) {
      this.isLoading = true
      this.error = null
      
      // Harus dipanggil di awal (sinkron) sebelum await, agar tidak kehilangan Vue Context
      let toast: any = null
      try {
        toast = useToast()
      } catch (err) {}
      
      try {
        if (!userValue) throw new Error('Sesi anda telah berakhir, silakan login ulang.')
        
        const uid = userValue.id || userValue.sub
        const email = userValue.email
        const meta = userValue.user_metadata || {}

        // Panggil internal API
        const response = await $fetch<any>('/api/duidku/create-payment', {
          method: 'POST',
          body: {
            amount,
            method, // <- Metode yang dipilih dari Modal
            userId: uid,
            userEmail: email,
            userName: meta.full_name || 'Member',
            userPhone: meta.phone || '0800000000'
          }
        })
        
        // Redirect ke payment URL
        if (response && response.success && response.paymentUrl) {
          window.location.href = response.paymentUrl
        } else {
          throw new Error('Gagal mendapatkan link pembayaran')
        }
      } catch (e: any) {
        this.error = e.statusMessage || e.message || 'Terjadi kesalahan'
        if (toast) {
          toast.addToast('Gagal Top Up: ' + this.error, 'error')
        } else {
          alert('Gagal Top Up: ' + this.error)
        }
      } finally {
        this.isLoading = false
      }
    }
  }
})
