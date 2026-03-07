import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '../backend');

// Files/Directories to ignore
const IGNORE_PATHS = ['node_modules', 'tests', 'db/migrations', 'scripts'];
const MANDATORY_FILTER = /organization_id|org_id/i;

console.log('🔍 Starting SaaS Query Audit...');
let violationCount = 0;

function auditFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');

    // Search for common query patterns
    // Pattern: query(`...`) or query('...')
    const queryRegex = /query\s*\(\s*[`'"]([\s\S]*?)[`'"]/g;
    let match;

    while ((match = queryRegex.exec(content)) !== null) {
        const sql = match[1];

        // Ignore schema modifications, insertions (handled by WITH CHECK), and explicit ignores
        if (sql.match(/CREATE TABLE|DROP TABLE|ALTER TABLE|INSERT INTO/i)) continue;
        if (content.substring(match.index - 50, match.index).includes('// audit-ignore')) continue;

        if (!MANDATORY_FILTER.test(sql)) {
            console.error(`\n❌ Violation in: ${path.relative(ROOT_DIR, filePath)}`);
            console.error(`   Query: ${sql.trim().substring(0, 100)}...`);
            console.error(`   Reason: Missing organization_id filter.`);
            violationCount++;
        }
    }
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const relativePath = path.relative(ROOT_DIR, fullPath);

        if (IGNORE_PATHS.some(ignore => relativePath.startsWith(ignore))) continue;

        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (file.endsWith('.js')) {
            auditFile(fullPath);
        }
    }
}

walkDir(ROOT_DIR);

if (violationCount === 0) {
    console.log('\n✅ Audit Passed: All queries have tenant filters (or are exempt).');
    process.exit(0);
} else {
    console.error(`\n🚨 Audit Failed: Found ${violationCount} security violations.`);
    process.exit(1);
}
