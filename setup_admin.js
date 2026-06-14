const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8').split('\n');
env.forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val) process.env[key.trim()] = val.join('=').trim();
});
const bcrypt = require('bcryptjs');
const { getSqlConnection } = require('./src/lib/azuresql.js');

async function createAdmin() {
  try {
    const pool = await getSqlConnection();
    const hash = await bcrypt.hash('omnilink', 10);
    
    // Check if exists
    const check = await pool.request().query(`SELECT * FROM USERS WHERE email = 'gulfamadmin@gmail.com'`);
    if (check.recordset.length > 0) {
      console.log('Admin already exists');
      process.exit(0);
    }

    await pool.request().query(`
      INSERT INTO USERS (username, email, password_hash, first_name, last_name, user_type, role_id, region_id) 
      VALUES ('Admin', 'gulfamadmin@gmail.com', '${hash}', 'Global', 'Admin', 'Admin', 1, 1)
    `);
    
    console.log('Admin inserted successfully');
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
createAdmin();
