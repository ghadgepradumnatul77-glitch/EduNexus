import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Client } = pg;

async function testConn() {
    const passwords = ['postgres', '', 'root', 'admin', '123456', 'Admin@123', 'postgresql', 'password'];
    for (const pwd of passwords) {
        console.log(`Trying password: '${pwd}'`);
        const client = new Client({
            host: 'localhost',
            port: 5432,
            user: 'postgres',
            password: pwd,
            database: 'postgres',
        });
        try {
            await client.connect();
            console.log(`✅ Success with password: '${pwd}'`);
            await client.end();
            return;
        } catch (err) {
            console.log(`❌ Failed with password: '${pwd}' - ${err.message}`);
        }
    }
}

testConn();
