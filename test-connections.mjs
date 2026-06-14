import sql from 'mssql';
import { MongoClient } from 'mongodb';

const AZURE_SQL_CONFIG = {
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

async function testAzureSQL() {
    console.log('\n🔷 Testing Azure SQL Connection...');
    console.log(`   Server  : ${process.env.AZURE_SQL_SERVER}`);
    console.log(`   Database: ${process.env.AZURE_SQL_DATABASE}`);
    try {
        const pool = await new sql.ConnectionPool(AZURE_SQL_CONFIG).connect();
        const result = await pool.request().query('SELECT 1 AS test, DB_NAME() AS db_name, GETDATE() AS server_time');
        console.log('✅ Azure SQL Connected!');
        console.log(`   Database : ${result.recordset[0].db_name}`);
        console.log(`   Server Time: ${result.recordset[0].server_time}`);

        // Check USERS table
        try {
            const users = await pool.request().query('SELECT COUNT(*) AS total FROM USERS');
            console.log(`   Users in DB: ${users.recordset[0].total}`);
        } catch (e) {
            console.warn('   ⚠️  USERS table not found or no access:', e.message);
        }

        await pool.close();
    } catch (err) {
        console.error('❌ Azure SQL FAILED:', err.message);
        console.error('   Code:', err.code || 'N/A');
    }
}

async function testMongoDB() {
    console.log('\n🍃 Testing MongoDB Connection...');
    console.log(`   URI: ${process.env.MONGODB_URI?.replace(/:([^@]+)@/, ':****@')}`);
    let client;
    try {
        client = new MongoClient(process.env.MONGODB_URI);
        await client.connect();
        const db = client.db('OMS_Product_Catalog');
        const collections = await db.listCollections().toArray();
        console.log('✅ MongoDB Connected!');
        console.log(`   Database: OMS_Product_Catalog`);
        console.log(`   Collections (${collections.length}): ${collections.map(c => c.name).join(', ')}`);

        // Check product count
        try {
            const productCount = await db.collection('products').countDocuments();
            console.log(`   Products: ${productCount}`);
        } catch (e) {
            console.warn('   ⚠️  products collection:', e.message);
        }
    } catch (err) {
        console.error('❌ MongoDB FAILED:', err.message);
    } finally {
        if (client) await client.close();
    }
}

async function main() {
    console.log('═══════════════════════════════════════');
    console.log('   OmniLink DB Connection Tester');
    console.log('═══════════════════════════════════════');
    await testAzureSQL();
    await testMongoDB();
    console.log('\n═══════════════════════════════════════');
    console.log('   Done!');
    console.log('═══════════════════════════════════════\n');
    process.exit(0);
}

main();
