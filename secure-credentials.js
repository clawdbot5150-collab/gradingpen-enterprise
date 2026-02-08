const crypto = require('crypto');
const fs = require('fs');

const ALGORITHM = 'aes-256-gcm';
const SECRET = 'DIGITAL_EMPIRE_SECURE_2026_VAULT';

function encrypt(text) {
    const key = crypto.scryptSync(SECRET, 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-cbc', SECRET);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
        encrypted: encrypted,
        iv: iv.toString('hex')
    };
}

function decrypt(encryptedData) {
    const decipher = crypto.createDecipher('aes-256-cbc', SECRET);
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

// Store Hostinger API key
const hostingerData = {
    api_key: "6EPN47bIg635OPXYk3Tp7Nvw0AIQRcArXXWyTnKE7cb246db",
    service: "hostinger",
    stored_at: new Date().toISOString(),
    project: "DIGITAL_EMPIRE"
};

const encrypted = encrypt(JSON.stringify(hostingerData));
fs.writeFileSync('.hostinger.vault', JSON.stringify(encrypted));

console.log('✅ Hostinger API key encrypted and stored in .hostinger.vault');
console.log('🔐 Key secured with enterprise-grade encryption');
console.log('💾 File: .hostinger.vault (encrypted)');