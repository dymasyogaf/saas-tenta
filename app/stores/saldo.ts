import { defineStore } from 'pinia'

export const useSaldoStore = defineStore('saldo', {
  state: () => ({
    balance: 0,
    pendingBalance: 0,
    transactions: [] as any[],
    isLoading: false,
    isFetchingSaldo: true,
    isFetchingTransactions: true,
    error: null as string | null
  }),

  actions: {
    async fetchSaldo() {
      this.isFetchingSaldo = true
      const user = useSupabaseUser()
      if (!user.value) {
        this.isFetchingSaldo = false
        return
      }

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
      } finally {
        this.isFetchingSaldo = false
      }
    },

    async fetchTransactions() {
      this.isFetchingTransactions = true
      const user = useSupabaseUser()
      if (!user.value) {
        this.isFetchingTransactions = false
        return
      }
      
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
      } finally {
        this.isFetchingTransactions = false
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
    },
    async allocate(amount: number, userValue: any, targetPlatform: string) {
      this.isLoading = true
      this.error = null
      
      let toast: any = null
      try {
        toast = useToast()
      } catch (err) {}
      
      try {
        if (!userValue) throw new Error('Sesi anda telah berakhir, silakan login ulang.')
        const uid = userValue.id || userValue.sub
        
        const response = await $fetch<any>('/api/saldo/transfer', {
          method: 'POST',
          body: {
            amount,
            user_id: uid,
            description: `Alokasi Saldo ke Akun ${targetPlatform}`
          }
        })
        
        if (response && response.success) {
          if (toast) toast.addToast('Berhasil mengalokasikan saldo', 'success')
          await this.fetchSaldo()
          await this.fetchTransactions()
          return true
        } else {
          throw new Error('Respons server tidak sesuai')
        }
      } catch (e: any) {
        this.error = e.data?.message || e.statusMessage || e.message || 'Terjadi kesalahan'
        if (toast) {
          toast.addToast('Gagal Alokasi: ' + this.error, 'error')
        } else {
          alert('Gagal Alokasi: ' + this.error)
        }
        return false
      } finally {
        this.isLoading = false
      }
    }
  }
})
