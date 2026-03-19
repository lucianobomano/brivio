const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), 'apps/web/.env.local');

console.log('Checking env file at:', envPath);

try {
    if (!fs.existsSync(envPath)) {
        console.error('ERROR: .env.local file NOT found!');
        process.exit(1);
    }

    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split('\n');

    let hasServiceKey = false;
    let serviceKeyLength = 0;

    lines.forEach(line => {
        const parts = line.split('=');
        if (parts[0].trim() === 'SUPABASE_SERVICE_ROLE_KEY') {
            hasServiceKey = true;
            serviceKeyLength = parts[1] ? parts[1].trim().length : 0;
        }
    });

    if (hasServiceKey) {
        console.log('SUCCESS: SUPABASE_SERVICE_ROLE_KEY found!');
        console.log(`Key length: ${serviceKeyLength} chars`);
        if (serviceKeyLength < 20) {
            console.warn('WARNING: Key seems too short. Check if it is valid.');
        }
    } else {
        console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY key is MISSING in .env.local');
        console.log('Found keys:', lines.map(l => l.split('=')[0].trim()).filter(k => k));
    }

} catch (e) {
    console.error('Error reading file:', e);
}
