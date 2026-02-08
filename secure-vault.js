#!/usr/bin/env node
/**
 * SECURE CREDENTIAL VAULT
 * Encrypted storage for deployment credentials
 * Usage: node secure-vault.js [store|retrieve|list]
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const VAULT_FILE = 'credentials.vault';
const ALGORITHM = 'aes-256-gcm';

class SecureVault {
    constructor(masterPassword) {
        this.masterKey = crypto.scryptSync(masterPassword, 'salt', 32);
    }

    encrypt(data) {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipher(ALGORITHM, this.masterKey);
        cipher.setAAD(Buffer.from('OpenClawVault'));
        
        let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const authTag = cipher.getAuthTag();
        
        return {
            iv: iv.toString('hex'),
            data: encrypted,
            authTag: authTag.toString('hex')
        };
    }

    decrypt(encryptedData) {
        const decipher = crypto.createDecipher(ALGORITHM, this.masterKey);
        decipher.setAAD(Buffer.from('OpenClawVault'));
        decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
        
        let decrypted = decipher.update(encryptedData.data, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return JSON.parse(decrypted);
    }

    store(service, credentials) {
        let vault = {};
        
        if (fs.existsSync(VAULT_FILE)) {
            const encryptedVault = JSON.parse(fs.readFileSync(VAULT_FILE, 'utf8'));
            vault = this.decrypt(encryptedVault);
        }
        
        vault[service] = credentials;
        
        const encrypted = this.encrypt(vault);
        fs.writeFileSync(VAULT_FILE, JSON.stringify(encrypted, null, 2));
        
        console.log(`✅ Stored credentials for: ${service}`);
    }

    retrieve(service) {
        if (!fs.existsSync(VAULT_FILE)) {
            throw new Error('❌ No vault found');
        }
        
        const encryptedVault = JSON.parse(fs.readFileSync(VAULT_FILE, 'utf8'));
        const vault = this.decrypt(encryptedVault);
        
        if (!vault[service]) {
            throw new Error(`❌ No credentials found for: ${service}`);
        }
        
        return vault[service];
    }

    list() {
        if (!fs.existsSync(VAULT_FILE)) {
            console.log('📁 No vault found');
            return;
        }
        
        const encryptedVault = JSON.parse(fs.readFileSync(VAULT_FILE, 'utf8'));
        const vault = this.decrypt(encryptedVault);
        
        console.log('🔐 Stored services:');
        Object.keys(vault).forEach(service => {
            console.log(`  - ${service}`);
        });
    }
}

// CLI Usage
if (require.main === module) {
    const [,, command, service, ...args] = process.argv;
    
    if (!command) {
        console.log('Usage: node secure-vault.js [store|retrieve|list]');
        process.exit(1);
    }
    
    const masterPassword = process.env.VAULT_PASSWORD || 'defaultPassword123!';
    const vault = new SecureVault(masterPassword);
    
    try {
        switch (command) {
            case 'store':
                if (!service) {
                    console.log('Usage: node secure-vault.js store <service>');
                    process.exit(1);
                }
                
                // Interactive credential input
                const credentials = {};
                console.log(`Enter credentials for ${service}:`);
                // This would need stdin input in real usage
                break;
                
            case 'retrieve':
                if (!service) {
                    console.log('Usage: node secure-vault.js retrieve <service>');
                    process.exit(1);
                }
                
                const creds = vault.retrieve(service);
                console.log(`🔓 Credentials for ${service}:`, creds);
                break;
                
            case 'list':
                vault.list();
                break;
                
            default:
                console.log('❌ Unknown command:', command);
        }
    } catch (error) {
        console.error(error.message);
        process.exit(1);
    }
}

module.exports = SecureVault;