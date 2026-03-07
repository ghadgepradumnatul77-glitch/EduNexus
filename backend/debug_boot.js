import { spawn } from 'child_process';
import fs from 'fs';

const child = spawn('node', ['server.js'], {
    stdio: 'pipe'
});

const logStream = fs.createWriteStream('crash_debug.log');

child.stdout.on('data', (data) => {
    process.stdout.write(data);
    logStream.write(data);
});

child.stderr.on('data', (data) => {
    process.stderr.write(data);
    logStream.write(data);
});

child.on('close', (code) => {
    console.log(`\nProcess exited with code ${code}`);
    logStream.write(`\nProcess exited with code ${code}`);
    logStream.end();
});
