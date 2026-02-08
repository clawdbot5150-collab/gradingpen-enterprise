#!/bin/bash
# LEVEL 3 AUTO-DEPLOYMENT SCRIPT
# Replace with your Hostinger FTP credentials

FTP_HOST="your-ftp-host"
FTP_USER="your-username"
FTP_PASS="your-password"

echo "🚀 Deploying to GradingPen.com..."

if command -v lftp &> /dev/null; then
    lftp -c "
        open -u $FTP_USER,$FTP_PASS $FTP_HOST
        cd public_html
        put index.html
        ls -l index.html
        bye
    "
    echo "✅ Deployment complete!"
    echo "🌐 Visit: https://gradingpen.com"
else
    echo "❌ lftp not installed. Manual upload required."
fi
