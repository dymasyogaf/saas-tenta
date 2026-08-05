import { defineStore } from 'pinia'
import { useAdsStore } from './ads'
import { useSupabaseUser, useSupabaseClient, useCsrf } from '#imports'
import { useToast } from '~/composables/useToast'


export const useSaldoStore = defineStore('saldo', {
  state: () => ({
    balance: 0,
    pendingBalance: 0,
    activePackage: null as string | null,
    weeklyLimit: 0 as number,
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
          .select('balance, pending_balance, user_id')
          .eq('user_id', uid)
          .single()
          
        if (error) throw error
        
        if (data) {
          this.balance = data.balance
          this.pendingBalance = data.pending_balance

          // Ambil info paket dari tabel users
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('active_package, package_weekly_limit')
            .eq('id', data.user_id)
            .single()
            
          if (!userError && userData) {
            this.activePackage = userData.active_package
            this.weeklyLimit = userData.package_weekly_limit
          }
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

    async topup(amount: number, userValue: any, method: string, packageType: string) {
      this.isLoading = true
      this.error = null
      
      // Harus dipanggil di awal (sinkron) sebelum await, agar tidak kehilangan Vue Context
      let toast: any = null
      let csrfToken: string | undefined = undefined
      try {
        toast = useToast()
        csrfToken = unref(useCsrf().csrf)
      } catch (err) {}
      
      try {
        if (!userValue) throw new Error('Sesi anda telah berakhir, silakan login ulang.')
        
        const uid = userValue.id || userValue.sub
        const email = userValue.email
        const meta = userValue.user_metadata || {}

        // Panggil internal API
        const response = await $fetch<any>('/api/duidku/create-payment', {
          method: 'POST',
          headers: csrfToken ? { 'csrf-token': csrfToken } : {},
          body: {
            amount,
            method, // <- Metode yang dipilih dari Modal
            packageType, // <- Paket yang dipilih
            userId: uid,
            userEmail: email,
            userName: meta.full_name || 'Member',
            userPhone: meta.phone || '0800000000'
          }
        })
        
        // Metode e-wallet / QRIS → tetap redirect ke Duitku
        const eWalletMethods = ['OV', 'SA', 'DA', 'SP', 'FT', 'IR']
        const isEWallet = eWalletMethods.includes(method)

        if (response && response.success) {
          if (isEWallet && response.paymentUrl) {
            // E-wallet: redirect ke halaman Duitku seperti biasa
            window.location.href = response.paymentUrl
          } else if (response.vaNumber || response.paymentCode) {
            // Virtual Account: redirect ke halaman custom kita sendiri
            const router = useRouter()
            await router.push({
              path: '/dashboard/topup/payment',
              query: {
                orderId: response.merchantOrderId,
                ref: response.reference,
                va: response.vaNumber || response.paymentCode,
                bank: response.paymentMethod,
                bankCode: response.bankCode,
                method: response.paymentName,
                amount: String(response.paymentAmount),
                net: String(response.netAmount),
                fee: String(response.feeAmount),
                pkg: response.packageType,
              }
            })
          } else if (response.paymentUrl) {
            // Fallback: redirect ke Duitku jika tidak ada data VA
            window.location.href = response.paymentUrl
          } else {
            throw new Error('Gagal mendapatkan data pembayaran')
          }
        } else {
          throw new Error('Gagal mendapatkan link pembayaran')
        }
      } catch (e: any) {
        this.error = e.data?.statusMessage || e.data?.message || e.statusMessage || e.message || 'Terjadi kesalahan'
        if (toast) {
          toast.addToast('Gagal Top Up: ' + this.error, 'error')
        } else {
          alert('Gagal Top Up: ' + this.error)
        }
      } finally {
        this.isLoading = false
      }
    },
    async allocate(amount: number, userValue: any, adAccountId: string, platform: string) {
      this.isLoading = true
      this.error = null
      
      let toast: any = null
      let csrfToken: string | undefined = undefined
      try {
        toast = useToast()
        csrfToken = unref(useCsrf().csrf)
      } catch (err) {}
      
      try {
        if (!userValue) throw new Error('Sesi anda telah berakhir, silakan login ulang.')
        const uid = userValue.id || userValue.sub
        
        const response = await $fetch<any>('/api/saldo/transfer', {
          method: 'POST',
          headers: csrfToken ? { 'csrf-token': csrfToken } : {},
          body: {
            amount,
            user_id: uid,
            ad_account_id: adAccountId,
            description: `Alokasi Saldo ke Akun ${platform}`
          }
        })
        
        if (response && response.success) {
          if (toast) toast.addToast('Berhasil mengalokasikan saldo', 'success')
          await this.fetchSaldo()
          await this.fetchTransactions()
          const adsStore = useAdsStore()
          await adsStore.fetchAdAccounts()
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
