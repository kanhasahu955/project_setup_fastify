import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Certificate paths
const CERT_DIR = path.join(__dirname, '../../certificates');
const KEY_PATH = path.join(CERT_DIR, 'server.key');
const CERT_PATH = path.join(CERT_DIR, 'server.crt');

export interface CertificateConfig {
    key: Buffer;
    cert: Buffer;
}

/**
 * Check if certificates exist
 */
export function certificatesExist(): boolean {
    return fs.existsSync(KEY_PATH) && fs.existsSync(CERT_PATH);
}

/**
 * Get certificate paths
 */
export function getCertificatePaths() {
    return {
        certDir: CERT_DIR,
        keyPath: KEY_PATH,
        certPath: CERT_PATH
    };
}

/**
 * Load certificates from disk
 * @throws Error if certificates don't exist
 */
export function loadCertificates(): CertificateConfig {
    if (!certificatesExist()) {
        throw new Error(`
            ❌ SSL Certificates not found!
            
            Please generate certificates first by running:
            npm run generate:cert
            
            Expected files:
            - ${KEY_PATH}
            - ${CERT_PATH}
        `);
    }

    return {
        key: fs.readFileSync(KEY_PATH),
        cert: fs.readFileSync(CERT_PATH)
    };
}

/**
 * Generate self-signed certificates
 */
export async function generateCertificates(options?: {
    commonName?: string;
    days?: number;
}): Promise<void> {
    const { commonName = 'localhost', days = 365 } = options || {};

    // Dynamically import selfsigned (dev dependency)
    const selfsigned = await import('selfsigned');
    
    const attrs = [
        { name: 'commonName', value: commonName },
        { name: 'organizationName', value: 'Development' },
        { name: 'countryName', value: 'IN' }
    ];

    // generate() returns a Promise in newer versions
    const pems = await selfsigned.generate(attrs, {
        keySize: 2048,
        days: days,
        algorithm: 'sha256',
        extensions: [
            {
                name: 'basicConstraints',
                cA: true
            },
            {
                name: 'keyUsage',
                keyCertSign: true,
                digitalSignature: true,
                keyEncipherment: true
            },
            {
                name: 'extKeyUsage',
                serverAuth: true,
                clientAuth: true
            },
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

    console.log(`
        ✅ SSL Certificates generated successfully!
        
        📁 Location: ${CERT_DIR}
        📄 Key: server.key
        📄 Certificate: server.crt
        ⏰ Valid for: ${days} days
        
        ⚠️  These are self-signed certificates for development only.
        Your browser may show a security warning - this is normal.
    `);
}
