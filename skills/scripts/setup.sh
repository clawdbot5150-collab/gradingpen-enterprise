#!/bin/bash
# setup.sh - One-time setup for GitHub + Hostinger deployment

echo "╔═══════════════════════════════════════════════════╗"
echo "║  GitHub + Hostinger Deployer - Initial Setup     ║"
echo "╚═══════════════════════════════════════════════════╝"
echo ""

# Create credentials directory
echo "📁 Creating credentials directory..."
mkdir -p ~/.deployer
chmod 700 ~/.deployer

# GitHub CLI setup
echo ""
echo "🐙 GitHub Setup"
echo "━━━━━━━━━━━━━━━━"

if command -v gh &> /dev/null; then
    echo "✅ GitHub CLI already installed"
    
    # Check if authenticated
    if gh auth status &> /dev/null; then
        echo "✅ Already authenticated with GitHub"
    else
        echo "🔐 Please authenticate with GitHub..."
        gh auth login
    fi
else
    echo "📥 Installing GitHub CLI..."
    
    # Install based on OS
    if [ -f /etc/debian_version ]; then
        # Debian/Ubuntu
        curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
        echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
        sudo apt update
        sudo apt install -y gh
    else
        echo "⚠️  Please install GitHub CLI manually: https://cli.github.com/"
        exit 1
    fi
    
    echo "🔐 Please authenticate with GitHub..."
    gh auth login
fi

# Hostinger credentials setup
echo ""
echo "🌐 Hostinger Setup"
echo "━━━━━━━━━━━━━━━━━"

CREDS_FILE="$HOME/.deployer/hostinger-credentials.json"

if [ -f "$CREDS_FILE" ]; then
    echo "✅ Credentials file already exists"
    read -p "Do you want to update it? (y/n): " UPDATE
    if [ "$UPDATE" != "y" ]; then
        echo "Keeping existing credentials"
    fi
fi

if [ ! -f "$CREDS_FILE" ] || [ "$UPDATE" == "y" ]; then
    echo ""
    echo "Please enter your Hostinger FTP credentials:"
    echo "(You can find these in Hostinger control panel > FTP Accounts)"
    echo ""
    
    read -p "FTP Host (e.g., ftp.yourdomain.com): " FTP_HOST
    read -p "FTP Username: " FTP_USER
    read -sp "FTP Password: " FTP_PASS
    echo ""
    read -p "FTP Port (default: 21): " FTP_PORT
    FTP_PORT=${FTP_PORT:-21}
    read -p "Remote directory (default: /public_html): " FTP_DIR
    FTP_DIR=${FTP_DIR:-/public_html}
    
    # Create credentials file
    cat > "$CREDS_FILE" << EOF
{
  "ftp": {
    "host": "$FTP_HOST",
    "port": $FTP_PORT,
    "username": "$FTP_USER",
    "password": "$FTP_PASS",
    "remoteDir": "$FTP_DIR"
  }
}
EOF
    
    chmod 600 "$CREDS_FILE"
    echo "✅ Credentials saved to $CREDS_FILE"
fi

# Install required tools
echo ""
echo "🔧 Installing Required Tools"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check and install jq
if ! command -v jq &> /dev/null; then
    echo "Installing jq..."
    sudo apt-get update && sudo apt-get install -y jq
fi

# Check and install lftp
if ! command -v lftp &> /dev/null; then
    echo "Installing lftp..."
    sudo apt-get install -y lftp
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "⚠️  Node.js not found. Install it from: https://nodejs.org/"
else
    echo "✅ Node.js $(node --version)"
fi

# Check npm
if ! command -v npm &> /dev/null; then
    echo "⚠️  npm not found"
else
    echo "✅ npm $(npm --version)"
fi

# Make scripts executable
echo ""
echo "🔐 Making scripts executable..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
chmod +x "$SCRIPT_DIR"/*.sh

echo ""
echo "╔═══════════════════════════════════════════════════╗"
echo "║          ✅ SETUP COMPLETE! 🎉                    ║"
echo "╚═══════════════════════════════════════════════════╝"
echo ""
echo "You're ready to deploy! Try:"
echo "  ./auto-deploy.sh ~/projects/my-website react"
echo ""
echo "Or create a new project:"
echo "  mkdir ~/projects/my-site && cd ~/projects/my-site"
echo "  npx create-react-app ."
echo "  gh repo create my-site --public --source=. --push"
echo "  ./auto-deploy.sh . react"
