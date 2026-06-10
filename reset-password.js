const sql = require('mssql');
const bcrypt = require('bcryptjs');

const cfg = {
  server: process.env.AZURE_SQL_SERVER,
  database: process.env.AZURE_SQL_DATABASE,
  authentication: { type: 'azure-active-directory-default', options: {} },
  options: { encrypt: true, trustServerCertificate: false }
};

async function main() {
  const pool = await sql.connect(cfg);
  
  // Hash the new password
  const newPassword = 'Password123!';
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(newPassword, salt);
  
  // Update the admin user
  await pool.request()
    .input('email', sql.NVarChar, 'gulfam@oms.com')
    .input('hash', sql.NVarChar, hash)
    .query("UPDATE USERS SET password_hash = @hash WHERE email = @email");
    
  console.log('✅ Admin password successfully reset.');
  console.log('Admin Email: gulfam@oms.com');
  console.log('New Password: Password123!');
  
  process.exit(0);
}

main().catch(e => { console.error('FAIL:', e.message); process.exit(1); });
