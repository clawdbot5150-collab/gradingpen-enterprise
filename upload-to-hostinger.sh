#!/bin/bash
echo "🚀 Uploading to Hostinger..."

# Read credentials (adjust path as needed)
CREDS=~/.deployer/hostinger-credentials.json

if [ -f "$CREDS" ]; then
    # Extract FTP details (requires jq)
    if command -v jq &> /dev/null; then
        FTP_HOST=$(jq -r '.ftp.host' "$CREDS")
        FTP_USER=$(jq -r '.ftp.username' "$CREDS") 
        FTP_PASS=$(jq -r '.ftp.password' "$CREDS")
        
        # Upload via LFTP
        lftp -c "
            open -u $FTP_USER,$FTP_PASS $FTP_HOST
            cd public_html
            put index.html
            ls -l index.html
            bye
        "
        echo "✅ Upload complete!"
    else
        echo "⚠️ Install jq: apt install jq"
    fi
else
    echo "❌ Credentials file not found: $CREDS"
fi
