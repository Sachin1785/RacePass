/**
 * test-verify.js
 * 
 * Reads a test image, converts it to base64, and compares it against
 * the stored face embedding for the wallet address via the running API server.
 * Prints distance, confidence, and match result.
 * 
 * Usage:
 *   node test-verify.js <path-to-test-image>
 * 
 * Example:
 *   node test-verify.js C:\Users\Me\Pictures\test-selfie.jpg
 */

const fs = require('fs');
const path = require('path');

const WALLET = '0xdb7bb4b066796232601b14a8454ddbb2b1c92141';
const API_BASE = 'http://localhost:3005';

async function main() {
    const imgArg = process.argv[2];

    if (!imgArg) {
        console.error('❌  Usage: node test-verify.js <path-to-test-image>');
        process.exit(1);
    }

    const absPath = path.resolve(imgArg);

    if (!fs.existsSync(absPath)) {
        console.error(`❌  File not found: ${absPath}`);
        process.exit(1);
    }

    // Read image and convert to base64
    const imageBuffer = fs.readFileSync(absPath);
    const ext = path.extname(absPath).toLowerCase().replace('.', '');
    const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
    const base64 = `data:${mime};base64,${imageBuffer.toString('base64')}`;

    const fileSizeKB = (imageBuffer.length / 1024).toFixed(1);

    console.log('🔍  Verifying face from:', absPath);
    console.log(`   File size  : ${fileSizeKB} KB`);
    console.log('👛  Wallet    :', WALLET);
    console.log('🌐  API       :', API_BASE);
    console.log('');

    // First check embedding exists
    const embRes = await fetch(`${API_BASE}/api/face/has-embedding/${WALLET}`);
    const embData = await embRes.json();

    if (!embData.hasEmbedding) {
        console.error('⚠️   No embedding found for this wallet. Run test-enroll.js first.');
        process.exit(1);
    }
    console.log('✅  Embedding found for wallet. Comparing...\n');

    // Send to verify
    const res = await fetch(`${API_BASE}/api/face/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: WALLET, liveImageBase64: base64 }),
    });

    const data = await res.json();

    console.log('─────────────────────────────────────');
    if (!data.success) {
        console.error('❌  Error:', data.error);
        console.log('');
        console.log('💡  Possible causes:');
        console.log('     • Face-API could not detect a face in the image');
        console.log('     • Image too dark, blurry, or face not fully visible');
        console.log('     • Try a different photo with a clear, well-lit frontal face');
        process.exit(1);
    }

    const matchSymbol = data.isMatch ? '✅  MATCH' : '❌  NO MATCH';
    const bar = makeBar(parseFloat(data.confidence), 40);

    console.log(`Result     : ${matchSymbol}`);
    console.log(`Confidence : ${data.confidence}`);
    console.log(`Distance   : ${data.distance}  (threshold: ${data.threshold} — lower = more similar)`);
    console.log(`Visual     : [${bar}] ${data.confidence}`);
    console.log('─────────────────────────────────────');

    if (!data.isMatch) {
        console.log('');
        console.log('💡  Tips:');
        console.log('     • Distance > 0.6 = different person (or very different conditions)');
        console.log('     • Try the same photo used for enrollment to confirm the system works');
        console.log('     • Confirm both photos are frontal, well-lit, unobstructed');
    }
}

function makeBar(pct, width) {
    const filled = Math.round((pct / 100) * width);
    return '█'.repeat(filled) + '░'.repeat(width - filled);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
