import { defineStore } from 'pinia'
import { useAdsStore } from './ads'
import { useSupabaseUser, useSupabaseClient } from '#imports'
import { useToast } from '~/composables/useToast'


export const useSaldoStore = defineStore('saldo', {
  state: () => ({
    balance: 0,
    pendingBalance: 0,
    usdBalance: 0,
    usdPendingBalance: 0,
    activePackage: null as string | null,
    weeklyLimit: 0 as number,
    packageExpiresAt: null as string | null,
    usdActivePackage: null as string | null,
    usdWeeklyLimit: 0 as number,
    usdPackageExpiresAt: null as string | null,
    activeSubscriptions: [] as any[],
    transactions: [] as any[],
    isLoading: false,
    isFetchingSaldo: true,
    isFetchingTransactions: true,
    error: null as string | null
  }),

  getters: {
    daysRemaining: (state) => {
      if (!state.packageExpiresAt) return 0
      const diffMs = new Date(state.packageExpiresAt).getTime() - Date.now()
      if (diffMs <= 0) return 0
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
      return days > 0 ? days : 1
    },
    isPackageExpired: (state) => {
      if (!state.packageExpiresAt) return true
      return new Date(state.packageExpiresAt).getTime() <= Date.now()
    },
    isExpiringSoon: (state) => {
      if (!state.packageExpiresAt) return false
      const diffMs = new Date(state.packageExpiresAt).getTime() - Date.now()
      if (diffMs <= 0) return true
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
      return days <= 5
    },
    usdDaysRemaining: (state) => {
      if (!state.usdPackageExpiresAt) return 0
      const diffMs = new Date(state.usdPackageExpiresAt).getTime() - Date.now()
      if (diffMs <= 0) return 0
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
      return days > 0 ? days : 1
    },
    isUsdPackageExpired: (state) => {
      if (!state.usdPackageExpiresAt) return true
      return new Date(state.usdPackageExpiresAt).getTime() <= Date.now()
    },
    formattedWeeklyLimit: (state) => {
      const pkg = state.activePackage?.toLowerCase()
      const limit = Number(state.weeklyLimit || 0)
      if (pkg === 'scale' || limit >= 999000000) {
        return 'Unlimited'
      }
      if (limit > 0) {
        return new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          minimumFractionDigits: 0
        }).format(limit)
      }
      return '-'
    },
    formattedUsdWeeklyLimit: (state) => {
      const pkg = state.usdActivePackage?.toLowerCase()
      const limit = Number(state.usdWeeklyLimit || 0)
      if (pkg === 'scale' || limit >= 999000000) {
        return 'Unlimited'
      }
      if (limit > 0) {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2
        }).format(limit)
      }
      return '-'
    }
  },

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
          .select('balance, pending_balance, usd_balance, usd_pending_balance, user_id')
          .eq('user_id', uid)
          .single()
          
        if (error) throw error
        
        if (data) {
          this.balance = data.balance || 0
          this.pendingBalance = data.pending_balance || 0
          this.usdBalance = data.usd_balance || 0
          this.usdPendingBalance = data.usd_pending_balance || 0

          // PERF-02: Parallelize subscription sync + user data fetch
          const [, userData] = await Promise.all([
            this.fetchActiveSubscriptions(),
            supabase
              .from('users')
              .select('active_package, package_weekly_limit, package_expires_at, usd_active_package, usd_package_weekly_limit, usd_package_expires_at')
              .eq('id', data.user_id)
              .single()
          ])

          if (!userData.error && userData.data) {
            this.activePackage = userData.data.active_package
            this.weeklyLimit = userData.data.package_weekly_limit
            this.packageExpiresAt = userData.data.package_expires_at

            this.usdActivePackage = userData.data.usd_active_package || null
            this.usdWeeklyLimit = userData.data.usd_package_weekly_limit || 0
            this.usdPackageExpiresAt = userData.data.usd_package_expires_at || null
          }
        }
      } catch (e: any) {
        console.error('Failed to fetch saldo:', e.message)
      } finally {
        this.isFetchingSaldo = false
      }
    },

    async fetchActiveSubscriptions(currencyOverride?: 'IDR' | 'USD') {
      try {
        // BUG-03: Safely get currency - try composable, fallback to override or default
        let currency: string = currencyOverride || 'IDR'
        try {
          const { isGlobal } = useAppMode()
          currency = isGlobal.value ? 'USD' : 'IDR'
        } catch { /* SSR fallback: use override or default */ }

        const response = await $fetch<any>('/api/saldo/active-subscriptions', {
          params: { currency }
        })
        if (response && response.success) {
          this.activeSubscriptions = response.subscriptions || []
        }
      } catch (e: any) {
        console.error('Failed to fetch active subscriptions:', e.message)
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
          const now = new Date().getTime()
          const validData = []
          const toDelete = []
          const { isGlobal } = useAppMode()
          const targetCurrency = isGlobal.value ? 'USD' : 'IDR'
          
          for (const tx of data as any[]) {
            // Determine transaction currency (fallback to detection if column null)
            const txRef = tx.payment_gateway_ref || ''
            const txDesc = tx.description || ''
            const isUsdTrx = tx.currency === 'USD' || txRef.startsWith('NP-') || txRef.startsWith('USDT-') || txDesc.includes('USDT') || txDesc.includes('NOWPayments') || txDesc.includes('Binance')
            const txCurrency = isUsdTrx ? 'USD' : 'IDR'

            // Skip transaction if currency doesn't match current mode
            if (txCurrency !== targetCurrency) {
              continue
            }

            if (tx.status === 'pending' && (tx.type === 'topup' || tx.type === 'subscription')) {
              const txTime = new Date(tx.created_at).getTime()
              // Jika lebih dari 60 menit (60 * 60 * 1000 ms)
              if (now - txTime > 60 * 60 * 1000) {
                toDelete.push(tx.id)
                continue // Jangan masukkan ke data yang ditampilkan
              }
            }
            validData.push(tx)
          }
          
          this.transactions = validData
          
          // Hapus diam-diam di background agar database bersih
          if (toDelete.length > 0) {
            supabase.from('transactions').delete().in('id', toDelete).then()
          }
        }
      } catch (e: any) {
        console.error('Failed to fetch transactions:', e.message)
      } finally {
        this.isFetchingTransactions = false
      }
    },

    async topup(amount: number, userValue: any, method: string, packageType: string, csrfToken?: string) {
      this.isLoading = true
      this.error = null
      
      // Toast harus dipanggil di awal (sinkron) sebelum await, agar tidak kehilangan Vue Context
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
          headers: csrfToken ? { 'x-csrf-token': csrfToken, 'csrf-token': csrfToken } : {},
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
            await navigateTo({
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
                createdAt: new Date().toISOString()
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
        let rawError = e.data?.statusMessage || e.data?.message || e.statusMessage || e.message || 'Terjadi kesalahan'
        if (typeof rawError === 'string' && (rawError.includes('<no response>') || rawError.includes('Load failed') || rawError.includes('Failed to fetch'))) {
          rawError = 'Koneksi ke server pembayaran terputus atau timeout. Silakan periksa koneksi internet Anda atau coba beberapa saat lagi.'
        }
        this.error = rawError
        if (toast) {
          toast.addToast('Gagal Top Up: ' + this.error, 'error')
        } else {
          useToast().addToast('Gagal Top Up: ' + this.error, 'error')
        }
      } finally {
        this.isLoading = false
      }
    },
    async allocate(amount: number, userValue: any, adAccountId: string, platform: string, csrfToken?: string) {
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
          headers: csrfToken ? { 'x-csrf-token': csrfToken, 'csrf-token': csrfToken } : {},
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
          useToast().addToast('Gagal Alokasi: ' + this.error, 'error')
        }
        return false
      } finally {
        this.isLoading = false
      }
    },

    async switchPackage(packageType: string, csrfToken?: string) {
      this.isLoading = true
      let toast: any = null
      try {
        toast = useToast()
      } catch (err) {}

      try {
        const headers: Record<string, string> = {}
        if (csrfToken) {
          headers['x-csrf-token'] = csrfToken
          headers['csrf-token'] = csrfToken
        }

        const response = await $fetch<any>('/api/saldo/switch-package', {
          method: 'POST',
          headers,
          body: { package_type: packageType }
        })
        if (response && response.success) {
          if (toast) toast.addToast(`Berhasil mengubah paket aktif menjadi ${packageType.toUpperCase()}`, 'success')
          await this.fetchSaldo()
          await this.fetchActiveSubscriptions()
          return true
        }
      } catch (e: any) {
        const msg = e.data?.message || e.message || 'Gagal mengubah paket'
        if (toast) toast.addToast(msg, 'error')
        return false
      } finally {
        this.isLoading = false
      }
    }
  }
})
