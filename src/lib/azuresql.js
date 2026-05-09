import sql from 'mssql';

const config = {
    server: process.env.AZURE_SQL_SERVER, 
    database: process.env.AZURE_SQL_DATABASE,
    user: process.env.AZURE_SQL_USER,
    port: 1433,
    options: {
        encrypt: true,
        trustServerCertificate: false,
    },
    authentication: {
        // Changed from 'interactive' to 'default' which is the standard for 
        // local development Entra ID logins in newer tedious versions.
        type: 'azure-active-directory-default' 
    }
};

let poolPromise;

export async function getSqlConnection() {
    if (poolPromise) return poolPromise;

    poolPromise = new sql.ConnectionPool(config)
        .connect()
        .then(pool => {
            console.log('✅ Connected to Azure SQL via Entra ID');
            return pool;
        })
        .catch(err => {
            console.error('❌ Database Connection Failed!', err);
            poolPromise = null; 
            throw err;
        });

    return poolPromise;
}