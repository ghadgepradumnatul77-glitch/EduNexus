import fs from 'fs';
import pool from './connection.js';

async function runFile(filePath) {
    try {
        const sql = fs.readFileSync(filePath, 'utf8');
        console.log(`🚀 Running SQL from: ${filePath}...`);
        await pool.query(sql);
        console.log('✅ Success!');
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        process.exit(0);
    }
}

const file = process.argv[2];
if (file) {
    runFile(file);
} else {
    console.error('Please provide a file path');
    process.exit(1);
}
