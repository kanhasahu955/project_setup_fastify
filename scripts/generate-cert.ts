/**
 * Script to generate self-signed SSL certificates
 * Run with: npm run generate:cert
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import selfsigned from 'selfsigned';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CERT_DIR = path.join(__dirname, '../certificates');
const KEY_PATH = path.join(CERT_DIR, 'server.key');
const CERT_PATH = path.join(CERT_DIR, 'server.crt');

function certificatesExist(): boolean {
    return fs.existsSync(KEY_PATH) && fs.existsSync(CERT_PATH);
}

async function main() {
    console.log('\n🔐 SSL Certificate Generator\n');
    
    if (certificatesExist()) {
        console.log('⚠️  Certificates already exist at:');
        console.log(`   - ${KEY_PATH}`);
        console.log(`   - ${CERT_PATH}`);
        console.log('\n   Delete them first if you want to regenerate.\n');
        
        const readline = await import('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        const answer = await new Promise<string>((resolve) => {
            rl.question('   Do you want to regenerate? (y/N): ', resolve);
        });
        rl.close();
        
        if (answer.toLowerCase() !== 'y') {
            console.log('\n   Aborted.\n');
            process.exit(0);
        }
    }

    try {
        const attrs = [
            { name: 'commonName', value: 'localhost' },
            { name: 'organizationName', value: 'Development' },
            { name: 'countryName', value: 'IN' }
        ];

        console.log('   Generating certificates...\n');

        // Generate certificates (async in newer versions)
        const pems = await selfsigned.generate(attrs, {
            keySize: 2048,
            days: 365,
            algorithm: 'sha256',
            extensions: [
                { name: 'basicConstraints', cA: true },
                { name: 'keyUsage', keyCertSign: true, digitalSignature: true, keyEncipherment: true },
                { name: 'extKeyUsage', serverAuth: true, clientAuth: true },
                {
                    name: 'subjectAltName',
                    altNames: [
                        { type: 2, value: 'localhost' },
                        { type: 2, value: '*.localhost' },
                        { type: 7, ip: '127.0.0.1' },
                        { type: 7, ip: '0.0.0.0' }
                    ]
                }
            ]
        });

        // Ensure certificates directory exists
        if (!fs.existsSync(CERT_DIR)) {
            fs.mkdirSync(CERT_DIR, { recursive: true });
        }

        // Write certificates
        fs.writeFileSync(KEY_PATH, pems.private);
        fs.writeFileSync(CERT_PATH, pems.cert);

        console.log(`   ✅ SSL Certificates generated successfully!
        
   📁 Location: ${CERT_DIR}
   📄 Key: server.key
   📄 Certificate: server.crt
   ⏰ Valid for: 365 days
        
   ⚠️  These are self-signed certificates for development only.
   Your browser may show a security warning - this is normal.
`);
    } catch (error) {
        console.error('❌ Failed to generate certificates:', error);
        process.exit(1);
    }
}

main();
