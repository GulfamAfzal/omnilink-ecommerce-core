import sql from 'mssql';

const config = {
    server: process.env.AZURE_SQL_SERVER,
    database: process.env.AZURE_SQL_DATABASE,
    port: 1433,
    options: {
        encrypt: true,
        trustServerCertificate: false,
    },
    authentication: {
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