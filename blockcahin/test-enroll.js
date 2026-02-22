/**
 * test-enroll.js
 * 
 * Generates a face embedding from an image file and stores it
 * against a wallet address in the database via the running API server.
 * 
 * Usage:
 *   node test-enroll.js <path-to-image>
 * 
 * Example:
 *   node test-enroll.js C:\Users\Me\Pictures\photo.jpg
 */

const fs = require('fs');
const path = require('path');

const WALLET = '0xdb7bb4b066796232601b14a8454ddbb2b1c92141';
const API_BASE = 'http://localhost:3005';

async function main() {
    const imgArg = process.argv[2];

    if (!imgArg) {
        console.error('❌  Usage: node test-enroll.js <path-to-image>');
        process.exit(1);
    }

    const absPath = path.resolve(imgArg);

    if (!fs.existsSync(absPath)) {
        console.error(`❌  File not found: ${absPath}`);
        process.exit(1);
    }

    console.log('📸  Enrolling face from:', absPath);
    console.log('👛  Wallet :', WALLET);
    console.log('🌐  API    :', API_BASE);
    console.log('');

    const res = await fetch(`${API_BASE}/api/face/generate-embedding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imagePath: absPath, address: WALLET }),
    });

    const data = await res.json();

    if (data.success) {
        console.log('✅  Embedding stored successfully!');
        console.log(`   Dimensions : ${data.dimensions} values (128D descriptor)`);
    } else {
        console.error('❌  Failed:', data.error);
        process.exit(1);
    }
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
