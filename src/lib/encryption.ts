const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY) {
    console.warn('ENCRYPTION_KEY not set, sensitive data will not be encrypted');
}

import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);
const ALGORITHM = 'aes-256-gcm';

export class EncryptionService {
    private static instance: EncryptionService;
    private key: Buffer | null = null;

    private constructor() { }

    static getInstance(): EncryptionService {
        if (!EncryptionService.instance) {
            EncryptionService.instance = new EncryptionService();
        }
        return EncryptionService.instance;
    }

    private async getKey(): Promise<Buffer> {
        if (!this.key) {
            const secret = process.env.NEXTAUTH_SECRET;
            if (!secret) {
                throw new Error('NEXTAUTH_SECRET environment variable is required for encryption');
            }

            const salt = Buffer.from('mcp-bridge-salt'); // Use a fixed salt for consistency
            this.key = (await scryptAsync(secret, salt, 32)) as Buffer;
        }
        return this.key;
    }

    async encrypt(text: string): Promise<string> {
        try {
            const key = await this.getKey();
            const iv = randomBytes(12); // GCM recommends 12 bytes for IV
            const cipher = createCipheriv(ALGORITHM, key, iv);

            let encrypted = cipher.update(text, 'utf8', 'hex');
            encrypted += cipher.final('hex');

            const authTag = cipher.getAuthTag();

            // Combine IV, authTag, and encrypted data
            const result = iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
            return 'enc:' + Buffer.from(result).toString('base64');
        } catch (error) {
            console.error('Encryption error:', error);
            // Fallback to simple encoding for development
            return 'enc:' + Buffer.from(text).toString('base64');
        }
    }

    async decrypt(encryptedText: string): Promise<string> {
        try {
            if (!encryptedText.startsWith('enc:')) {
                return encryptedText; // Not encrypted
            }

            const data = Buffer.from(encryptedText.slice(4), 'base64').toString();

            // Check if it's properly encrypted or just base64 encoded
            if (!data.includes(':')) {
                // Simple base64 encoded (fallback)
                return Buffer.from(data, 'base64').toString('utf8');
            }

            const parts = data.split(':');
            if (parts.length !== 3) {
                throw new Error('Invalid encrypted data format');
            }

            const [ivHex, authTagHex, encrypted] = parts;
            const key = await this.getKey();
            const iv = Buffer.from(ivHex, 'hex');
            const authTag = Buffer.from(authTagHex, 'hex');

            const decipher = createDecipheriv(ALGORITHM, key, iv);
            decipher.setAuthTag(authTag);

            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');

            return decrypted;
        } catch (error) {
            console.error('Decryption error:', error);
            // Attempt fallback decoding
            try {
                const data = Buffer.from(encryptedText.slice(4), 'base64').toString('utf8');
                return data;
            } catch {
                throw new Error('Failed to decrypt data');
            }
        }
    }

    isEncrypted(text: string): boolean {
        return text.startsWith('enc:');
    }
}

export const encryptionService = EncryptionService.getInstance();

interface AuthConfig {
    type: 'none' | 'bearer' | 'apikey' | 'basic';
    token?: string;
    apiKey?: string;
    username?: string;
    password?: string;
}

// Utility to encrypt auth configurations
export async function encryptAuthConfig(authConfig: AuthConfig): Promise<string> {
    if (!authConfig || authConfig.type === 'none') {
        return JSON.stringify(authConfig);
    }

    const sensitiveFields = ['token', 'apiKey', 'password'] as const;
    const configCopy = { ...authConfig };

    // Encrypt sensitive fields
    const encryption = EncryptionService.getInstance();
    for (const field of sensitiveFields) {
        if (configCopy[field]) {
            configCopy[field] = await encryption.encrypt(configCopy[field]);
        }
    }

    return JSON.stringify(configCopy);
}

// Utility to decrypt auth configurations
export async function decryptAuthConfig(encryptedConfig: string): Promise<AuthConfig> {
    if (!encryptedConfig) return { type: 'none' };

    try {
        const config = JSON.parse(encryptedConfig);

        if (!config || config.type === 'none') {
            return config;
        }

        const sensitiveFields = ['token', 'apiKey', 'password'] as const;
        const encryption = EncryptionService.getInstance();

        // Decrypt sensitive fields
        for (const field of sensitiveFields) {
            if (config[field]) {
                try {
                    config[field] = await encryption.decrypt(config[field]);
                } catch (error) {
                    console.error(`Failed to decrypt ${field}:`, error);
                    // Remove invalid encrypted data
                    delete config[field];
                }
            }
        }

        return config;
    } catch (error) {
        console.error('Failed to parse auth config:', error);
        return { type: 'none' };
    }
}
