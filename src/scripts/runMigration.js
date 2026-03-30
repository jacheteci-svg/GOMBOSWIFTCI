import { createClient } from '@insforge/sdk';
import fs from 'fs';
import path from 'path';

const insforgeUrl = process.env.VITE_INSFORGE_URL || 'https://xb32m532.eu-central.insforge.app';
const insforgeAnonKey = process.env.VITE_INSFORGE_ANON_KEY || 'ik_32097ec6a224ea72aa63bb596ea7a668';

// This migration requires SuperAdmin or Service Role privileges
// However, insforge-cli might be better if I run it via child_process
import { execSync } from 'child_process';

try {
  const sql = fs.readFileSync(path.join(__dirname, 'saas_plans.sql'), 'utf-8');
  console.log('Running SQL via insforge-cli...');
  
  // Clean newlines for CLI args (replace newlines with space, but careful with comments)
  // Let's strip the `-- comments` first
  let cleanedSql = sql.split('\n').filter(line => !line.trim().startsWith('--')).join(' ');
  
  const cmd = `npx @insforge/cli db query "${cleanedSql.replace(/"/g, '\\"')}"`;
  execSync(cmd, { stdio: 'inherit' });
  console.log('Migration successful.');
} catch (err) {
  console.error('Migration failed:', err.message);
}
