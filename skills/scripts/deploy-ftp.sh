#!/bin/bash
# deploy-ftp.sh - Deploy website to Hostinger via FTP

set -e

# Check for required arguments
if [ $# -lt 1 ]; then
    echo "Usage: $0 <build-directory> [credentials-file]"
    echo "Example: $0 ./build ~/.deployer/hostinger-credentials.json"
    exit 1
fi

BUILD_DIR="$1"
CREDENTIALS_FILE="${2:-$HOME/.deployer/hostinger-credentials.json}"

# Validate build directory exists
if [ ! -d "$BUILD_DIR" ]; then
    echo "❌ Error: Build directory '$BUILD_DIR' not found"
    exit 1
fi

# Validate credentials file exists
if [ ! -f "$CREDENTIALS_FILE" ]; then
    echo "❌ Error: Credentials file '$CREDENTIALS_FILE' not found"
    echo "Create it with:"
    echo "mkdir -p ~/.deployer"
    echo "nano ~/.deployer/hostinger-credentials.json"
    exit 1
fi

# Install jq if not present
command -v jq >/dev/null 2>&1 || {
    echo "Installing jq..."
    apt-get update && apt-get install -y jq
}

# Install lftp if not present
command -v lftp >/dev/null 2>&1 || {
    echo "Installing lftp..."
    apt-get update && apt-get install -y lftp
}

# Load credentials
FTP_HOST=$(jq -r '.ftp.host' "$CREDENTIALS_FILE")
FTP_PORT=$(jq -r '.ftp.port // 21' "$CREDENTIALS_FILE")
FTP_USER=$(jq -r '.ftp.username' "$CREDENTIALS_FILE")
FTP_PASS=$(jq -r '.ftp.password' "$CREDENTIALS_FILE")
FTP_DIR=$(jq -r '.ftp.remoteDir // "/public_html"' "$CREDENTIALS_FILE")

# Validate credentials were loaded
if [ "$FTP_HOST" == "null" ] || [ "$FTP_USER" == "null" ] || [ "$FTP_PASS" == "null" ]; then
    echo "❌ Error: Invalid credentials file format"
    exit 1
fi

echo "🚀 Deploying to Hostinger via FTP..."
echo "📁 Source: $BUILD_DIR"
echo "🌐 Host: $FTP_HOST"
echo "👤 User: $FTP_USER"
echo "📂 Remote: $FTP_DIR"

# Deploy using lftp (disable SSL verification for Hostinger cert mismatch)
lftp -c "
set ssl:verify-certificate no;
set ftp:ssl-allow no;
open -u $FTP_USER,\"$FTP_PASS\" -p $FTP_PORT $FTP_HOST;
mirror --reverse --delete --verbose --parallel=3 $BUILD_DIR $FTP_DIR;
bye
"

echo "✅ Deployment successful!"
echo "🌍 Your website should be live at your domain"
