// generate-config.js — generates js/supabase-config.js from environment variables
// Run at build time: node generate-config.js
// Vercel sets SUPABASE_URL and SUPABASE_ANON_KEY via Environment Variables dashboard

const fs = require('fs');
const path = require('path');

// Try reading .env file for local builds
try {
  const envPath = path.join(__dirname, '.env');
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim();
        if (!process.env[key]) process.env[key] = val;
      }
    }
  });
} catch (_) {
  // .env is optional — use process.env (Vercel sets these)
}

const url = process.env.SUPABASE_URL || '';
const key = process.env.SUPABASE_ANON_KEY || '';

if (!url || !key) {
  console.error('ERROR: SUPABASE_URL and SUPABASE_ANON_KEY must be set');
  console.error('Locally: add them to .env file');
  console.error('Vercel: set them in Project Settings → Environment Variables');
  process.exit(1);
}

const output = `export const supabaseUrl = ${JSON.stringify(url)};
export const supabaseKey = ${JSON.stringify(key)};
`;

fs.writeFileSync(path.join(__dirname, 'js', 'supabase-config.js'), output);
console.log('✅ Generated js/supabase-config.js');
