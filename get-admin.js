const sql = require('mssql');

const cfg = {
  server: process.env.AZURE_SQL_SERVER,
  database: process.env.AZURE_SQL_DATABASE,
  authentication: { type: 'azure-active-directory-default', options: {} },
  options: { encrypt: true, trustServerCertificate: false }
};

async function main() {
  const pool = await sql.connect(cfg);
  const r = await pool.request().query("SELECT user_id, username, email, password_hash, user_type FROM USERS WHERE user_type='Admin'");
  console.log('App Admins:', JSON.stringify(r.recordset, null, 2));
  process.exit(0);
}

main().catch(e => { console.error('FAIL:', e.message); process.exit(1); });
