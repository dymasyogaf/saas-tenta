const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const urlMatch = env.match(/NUXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/SUPABASE_SERVICE_KEY=(.*)/);
const url = urlMatch[1].trim();
const key = keyMatch[1].trim();

async function run() {
  const headers = {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json'
  };

  // 1. Get user
  const usersRes = await fetch(`${url}/rest/v1/users?full_name=ilike.*Dymas%20Yoga*`, { headers });
  const users = await usersRes.json();
  
  if (!users || users.length === 0) {
    console.error("User Dymas Yoga not found");
    return;
  }
  const user = users[0];
  console.log("Found user:", user.full_name, user.id);

  // 2. Get current balance
  const saldoRes = await fetch(`${url}/rest/v1/saldo?user_id=eq.${user.id}`, { headers });
  const saldoArray = await saldoRes.json();
  const currentSaldo = saldoArray[0].balance;
  const newSaldo = parseFloat(currentSaldo) + 150000;

  // 3. Update balance
  const updateSaldo = await fetch(`${url}/rest/v1/saldo?user_id=eq.${user.id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ balance: newSaldo, updated_at: new Date().toISOString() })
  });
  console.log("Update Saldo status:", updateSaldo.status);

  // 4. Insert transaction
  const insertTx = await fetch(`${url}/rest/v1/transactions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      user_id: user.id,
      type: 'refund',
      amount: 150000,
      status: 'success',
      description: 'Refund penghapusan akun iklan'
    })
  });
  console.log("Insert Transaction status:", insertTx.status);
}

run().catch(console.error);
