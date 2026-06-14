const fs = require('fs');
const sql = require('mssql');

const env = fs.readFileSync('.env', 'utf-8');
const DB_SERVER = env.match(/AZURE_SQL_SERVER=(.+)/)[1].trim();
const DB_DATABASE = env.match(/AZURE_SQL_DATABASE=(.+)/)[1].trim();

(async () => {
  try {
    const pool = await sql.connect({
      server: DB_SERVER,
      database: DB_DATABASE,
      authentication: { type: 'azure-active-directory-default' },
      options: { encrypt: true, trustServerCertificate: false }
    });
    
    // Add columns if they do not exist
    await pool.request().query(`
      IF NOT EXISTS(SELECT * FROM sys.columns WHERE Name = N'currency' AND Object_ID = Object_ID(N'USERS'))
      BEGIN
          ALTER TABLE USERS ADD currency NVARCHAR(3) DEFAULT 'USD';
      END

      IF NOT EXISTS(SELECT * FROM sys.columns WHERE Name = N'address' AND Object_ID = Object_ID(N'USERS'))
      BEGIN
          ALTER TABLE USERS ADD address NVARCHAR(500) DEFAULT '';
      END
    `);
    console.log('Successfully added currency and address columns to USERS table.');

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
