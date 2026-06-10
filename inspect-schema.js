// Schema inspection script
const sql = require('mssql');


const cfg = {
  server: process.env.AZURE_SQL_SERVER,
  database: process.env.AZURE_SQL_DATABASE,
  authentication: { type: 'azure-active-directory-default', options: {} },
  options: { encrypt: true, trustServerCertificate: false }
};

async function main() {
  const pool = await sql.connect(cfg);
  console.log('✅ Connected');

  for (const table of ['ORDERS', 'ORDER_DETAIL', 'REGIONS', 'USERS']) {
    const r = await pool.request().query(
      `SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='${table}' ORDER BY ORDINAL_POSITION`
    );
    console.log(`\n${table}:`, r.recordset.map(c => c.COLUMN_NAME).join(', '));
  }

  // Also show sample data from REGIONS
  const regions = await pool.request().query('SELECT * FROM REGIONS');
  console.log('\nREGIONS data:', JSON.stringify(regions.recordset));
  
  process.exit(0);
}

main().catch(e => { console.error('FAIL:', e.message); process.exit(1); });
