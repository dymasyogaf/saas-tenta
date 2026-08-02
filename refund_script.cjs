const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NUXT_PUBLIC_SUPABASE_URL,
  process.env.NUXT_SUPABASE_SERVICE_KEY
);

async function run() {
  // Find transaction
  const { data: trx, error: errTrx } = await supabase
    .from('transactions')
    .select('*')
    .eq('description', 'Alokasi Anggaran Iklan - MPC - CL 5 (google)')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (errTrx || !trx) {
    console.error('Trx not found', errTrx);
    return;
  }
  
  const userId = trx.user_id;

  // Add 100000 to saldo
  const { data: saldoData } = await supabase.from('saldo').select('*').eq('user_id', userId).single();
  const newBalance = Number(saldoData.balance) + 100000;
  
  await supabase.from('saldo').update({ balance: newBalance }).eq('user_id', userId);
  console.log(`Balance updated to ${newBalance}`);

  // Insert refund transaction
  await supabase.from('transactions').insert({
    user_id: userId,
    amount: 100000,
    type: 'deposit',
    status: 'success',
    description: 'Refund Pembatalan Alokasi Iklan (Manual Script)',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
  console.log('Refund transaction inserted');
}

run();
